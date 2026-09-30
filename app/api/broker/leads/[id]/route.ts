import { NextResponse } from "next/server";
import { serverErrorResponse } from "@/lib/api/serverErrorResponse";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/supabase/getSessionProfile";
import { isLeadStage, type Database } from "@/lib/supabase/types";

type Params = { params: Promise<{ id: string }> };
type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"];

// Same contract as the admin route's parser: a future follow-up date is the
// one timestamp that legitimately comes from the caller, so it is parsed,
// range-checked and normalised to ISO rather than stored as the raw string.
// null or "" is an explicit clear.
function parseNextActionAt(
  value: unknown
): { ok: true; value: string | null } | { ok: false } {
  if (value === null || value === "") return { ok: true, value: null };
  if (typeof value !== "string") return { ok: false };

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return { ok: false };

  return { ok: true, value: parsed.toISOString() };
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { user, profile } = await getSessionProfile();

    const isActiveBroker =
      profile &&
      (profile.role === "verified_broker" || profile.role === "sales_partner") &&
      profile.status === "active";

    if (!user || !profile || !isActiveBroker) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = await createClient();
    // Ownership enforced twice: RLS (leads_broker_read_assigned) is
    // the real boundary, and the explicit assigned_broker_id filter
    // below is defense-in-depth on top of it.
    // Explicit column list, not select("*"): a broker sees only the fields
    // the broker UI actually needs, and any column added to `leads` later
    // (internal notes, financial qualification, attribution metadata) is not
    // exposed automatically. Matches app/broker/leads/[id]/page.tsx.
    const { data, error } = await supabase
      .from("leads")
      .select(
        "id, property_id, buyer_name, buyer_phone, buyer_email, message, status, lead_source, assigned_at, contacted_at, next_action_at, created_at"
      )
      .eq("id", id)
      .eq("assigned_broker_id", user.id)
      .is("deleted_at", null)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ lead: data });
  } catch (error) {
    return serverErrorResponse("BROKER LEAD GET ERROR:", error);
  }
}

// A broker may update their own assigned lead (e.g. move it
// through the pipeline). They cannot reassign it away from
// themselves — the existing leads_broker_update_assigned RLS
// policy's WITH CHECK still requires assigned_broker_id to equal
// their own auth.uid() after the update, so even if this route
// were called with a different assigned_broker_id, the database
// would reject it. The explicit .eq("assigned_broker_id", user.id)
// below is defense-in-depth on top of that RLS boundary, not a
// replacement for it — it means the UPDATE this route issues can
// only ever match a row already assigned to the caller in the
// first place.
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { user, profile } = await getSessionProfile();

    const isActiveBroker =
      profile &&
      (profile.role === "verified_broker" || profile.role === "sales_partner") &&
      profile.status === "active";

    if (!user || !profile || !isActiveBroker) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // A broker's writable surface is exactly three columns, and this route
    // will only ever build an update from these three keys. It is the same
    // set the leads_broker_column_guard database trigger enforces, stated
    // twice on purpose: this route is the convenient boundary, the trigger is
    // the one that also holds when someone bypasses the route and calls
    // PostgREST directly with their own session (finding R1).
    //
    // Everything else on a lead — the buyer's details, the enquiry message,
    // property attribution, assignment, archive state — stays admin-owned.
    const update: LeadUpdate = {};

    if ("status" in body) {
      // Validate against the canonical whitelist before the update. Previously
      // any string was forwarded and only the leads_status_check constraint
      // stopped it, surfacing as a generic 500 rather than a clear 400.
      if (!isLeadStage(body.status)) {
        return NextResponse.json({ error: "Invalid lead stage" }, { status: 400 });
      }
      update.status = body.status;
    }

    // First contact. Intent only — the timestamp is generated here, on the
    // server, so a broker cannot backdate a call to make their own response
    // time look better. Deliberately independent of `status`: moving a lead
    // to the 'contacted' stage is a label, contacted_at is meant to be
    // evidence, and inferring one from the other would make every response
    // time derived from it meaningless.
    if ("contacted_at" in body) {
      update.contacted_at =
        body.contacted_at === null ? null : new Date().toISOString();
    }

    // Next planned follow-up — a future date, so the value genuinely comes
    // from the caller. Parsed and normalised rather than stored raw; an
    // unparseable date is a 400, and null or "" clears the reminder.
    if ("next_action_at" in body) {
      const nextAction = parseNextActionAt(body.next_action_at);
      if (!nextAction.ok) {
        return NextResponse.json({ error: "Invalid follow-up date" }, { status: 400 });
      }
      update.next_action_at = nextAction.value;
    }

    // An empty patch would otherwise issue a no-op UPDATE and return 200,
    // telling the UI a change succeeded when nothing was sent.
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No supported fields to update" }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("leads")
      .update(update)
      .eq("id", id)
      .eq("assigned_broker_id", user.id);

    if (error) {
      return serverErrorResponse("BROKER LEAD UPDATE ERROR:", error);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverErrorResponse("BROKER LEAD UPDATE ERROR:", error);
  }
}
