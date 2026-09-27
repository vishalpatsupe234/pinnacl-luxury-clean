import { NextResponse } from "next/server";
import { serverErrorResponse } from "@/lib/api/serverErrorResponse";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/supabase/getSessionProfile";
import { isLeadStage, type Database } from "@/lib/supabase/types";

type Params = { params: Promise<{ id: string }> };
type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"];

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
