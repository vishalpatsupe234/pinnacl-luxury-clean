import { NextResponse } from "next/server";
import { serverErrorResponse } from "@/lib/api/serverErrorResponse";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/supabase/getSessionProfile";
import { isLeadStage, isLeadSource, type Database } from "@/lib/supabase/types";

type Params = { params: Promise<{ id: string }> };
type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"];

// Parses a caller-supplied follow-up date.
//
// Unlike `contacted_at` and `deleted_at` — which record "this happened, now"
// and therefore take a server-generated timestamp — `next_action_at` is a
// genuine future date the user picks, so the value has to come from the
// request. It is still never trusted verbatim: the string is parsed, an
// unparseable or out-of-range date is rejected with a 400 rather than
// reaching the column, and what gets stored is the normalised ISO form of
// the parsed Date, not the caller's original string.
//
// Returns { ok: true, value } on success — where `value` is null for an
// explicit clear — and { ok: false } for anything malformed.
function parseNextActionAt(
  value: unknown
): { ok: true; value: string | null } | { ok: false } {
  if (value === null || value === "") return { ok: true, value: null };
  if (typeof value !== "string") return { ok: false };

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return { ok: false };

  return { ok: true, value: parsed.toISOString() };
}

// Admin can edit any lead field, assign/reassign a broker, and
// change the pipeline stage — all via the existing leads RLS.
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { user, profile } = await getSessionProfile();
    if (!user || !profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const supabase = await createClient();

    const update: LeadUpdate = {};
    if (typeof body.buyer_name === "string") update.buyer_name = body.buyer_name.trim();
    if ("buyer_phone" in body) update.buyer_phone = body.buyer_phone || null;
    if ("buyer_email" in body) update.buyer_email = body.buyer_email || null;
    if ("message" in body) update.message = body.message || null;
    if ("property_id" in body) update.property_id = body.property_id || null;

    // Validate the assignee before the lead is touched.
    //
    // The dropdown in app/admin/leads/page.tsx already offers only eligible
    // brokers, but the API is the security boundary, not the dropdown — a
    // crafted request could otherwise assign a lead to a viewer, a suspended
    // broker, or the super_admin. The FK to profiles(id) only catches a
    // non-existent uuid, and does so as a generic 500.
    //
    // The rule mirrors the dropdown query and is_active_broker() exactly:
    //   role in ('verified_broker','sales_partner') AND status = 'active'
    // super_admin and viewer are therefore not assignable. No new rule is
    // introduced here.
    //
    // is_active_broker() itself is not usable for this check: it tests
    // auth.uid(), i.e. the caller, not an arbitrary target profile.
    if ("assigned_broker_id" in body) {
      const assigneeId = body.assigned_broker_id;

      // Only null and "" mean unassignment. A truthiness check (`|| null`)
      // would also fold 0, false and NaN into null and silently unassign the
      // lead instead of rejecting a malformed request, so the two accepted
      // "empty" forms are matched explicitly and everything else that is not
      // a string is rejected.
      if (assigneeId === null || assigneeId === "") {
        update.assigned_broker_id = null;
      } else if (typeof assigneeId !== "string") {
        return NextResponse.json(
          { error: "Invalid broker assignment" },
          { status: 400 }
        );
      } else {
        // A malformed uuid makes Postgres raise 22P02 rather than returning
        // no rows, so the error branch is treated as "invalid" too — that
        // keeps a database error out of the response and returns a clean 400.
        const { data: assignee, error: assigneeError } = await supabase
          .from("profiles")
          .select("id, role, status")
          .eq("id", assigneeId)
          .maybeSingle();

        const eligible =
          !assigneeError &&
          assignee !== null &&
          (assignee.role === "verified_broker" ||
            assignee.role === "sales_partner") &&
          assignee.status === "active";

        if (!eligible) {
          return NextResponse.json(
            { error: "Invalid broker assignment" },
            { status: 400 }
          );
        }

        update.assigned_broker_id = assignee.id;
      }
    }

    // Validate the stage against the canonical whitelist before it reaches
    // the database. The leads_status_check constraint would reject an invalid
    // value anyway, but only as a generic 500 via serverErrorResponse — this
    // returns a clean 400 and keeps the constraint error out of the response.
    if ("status" in body) {
      if (!isLeadStage(body.status)) {
        return NextResponse.json({ error: "Invalid lead stage" }, { status: 400 });
      }
      update.status = body.status;
    }

    // Acquisition channel. Validated against the canonical allowlist for the
    // same reason as the stage above: leads_lead_source_check would reject a
    // bad value anyway, but only as a generic 500. An explicit null clears it
    // back to "not recorded".
    if ("lead_source" in body) {
      const source = body.lead_source;
      if (source === null || source === "") {
        update.lead_source = null;
      } else if (!isLeadSource(source)) {
        return NextResponse.json({ error: "Invalid lead source" }, { status: 400 });
      } else {
        update.lead_source = source;
      }
    }

    // First contact — a deliberate event, never an inferred one.
    //
    // Same shape as the archive block below: the caller supplies INTENT, not
    // a value. Any non-null body value records contact with a SERVER-generated
    // timestamp, and only an explicit null clears it, so a client cannot
    // backdate a call or forge a response time that makes a broker look
    // faster than they were.
    //
    // Deliberately NOT coupled to `status`. Moving a lead to the 'contacted'
    // stage is a label someone typed; contacted_at is meant to be evidence
    // that a call or message actually happened. Auto-setting it from a stage
    // change would make every response-time figure derived from it worthless.
    // The two are set independently, by two separate controls.
    if ("contacted_at" in body) {
      update.contacted_at =
        body.contacted_at === null ? null : new Date().toISOString();
    }

    // Next planned follow-up. A future date, so the value does come from the
    // caller — parsed and normalised, never stored raw. See parseNextActionAt.
    if ("next_action_at" in body) {
      const nextAction = parseNextActionAt(body.next_action_at);
      if (!nextAction.ok) {
        return NextResponse.json({ error: "Invalid follow-up date" }, { status: 400 });
      }
      update.next_action_at = nextAction.value;
    }

    // `assigned_at` is intentionally NOT accepted from the request body at
    // all. It is owned by the leads_assignment_timestamp database trigger,
    // which derives it from assigned_broker_id on every write — so it stays
    // correct for this route, for any future bulk reassignment, and for a
    // manual SQL correction alike, and no caller can forge it.

    // Archive / restore — soft delete only, never a hard DELETE.
    //
    // The caller supplies intent, not a value: any non-null `deleted_at`
    // archives with a SERVER-generated timestamp, and only an explicit null
    // restores. A client therefore cannot backdate an archive, forge a
    // timestamp, or inject a non-date value. The row and every field on it
    // are preserved either way, and the existing leads_audit trigger records
    // the change automatically — no separate audit path.
    if ("deleted_at" in body) {
      update.deleted_at =
        body.deleted_at === null ? null : new Date().toISOString();
    }

    const { error } = await supabase.from("leads").update(update).eq("id", id);

    if (error) {
      return serverErrorResponse("ADMIN LEAD UPDATE ERROR:", error);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverErrorResponse("ADMIN LEAD UPDATE ERROR:", error);
  }
}
