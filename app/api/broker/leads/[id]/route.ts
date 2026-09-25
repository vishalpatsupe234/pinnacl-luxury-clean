import { NextResponse } from "next/server";
import { serverErrorResponse } from "@/lib/api/serverErrorResponse";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/supabase/getSessionProfile";

type Params = { params: Promise<{ id: string }> };

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
      .select("id, property_id, buyer_name, buyer_phone, buyer_email, message, status, created_at")
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
    if (!body || typeof body.status !== "string") {
      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("leads")
      .update({ status: body.status })
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
