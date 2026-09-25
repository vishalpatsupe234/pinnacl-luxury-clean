import { NextResponse } from "next/server";
import { serverErrorResponse } from "@/lib/api/serverErrorResponse";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/supabase/getSessionProfile";
import type { LeadStage } from "@/lib/supabase/types";

// Read-only list, scoped to the broker's own assigned leads only.
// Ownership is enforced twice: the existing leads_broker_read_assigned
// RLS policy is the real security boundary (a broker session simply
// cannot see rows assigned to someone else at the database layer),
// and the explicit .eq("assigned_broker_id", user.id) below is
// defense-in-depth — it means this route's own intent is correct
// even considered on its own, independent of RLS.
export async function GET(request: Request) {
  try {
    const { user, profile } = await getSessionProfile();

    const isActiveBroker =
      profile &&
      (profile.role === "verified_broker" || profile.role === "sales_partner") &&
      profile.status === "active";

    if (!user || !profile || !isActiveBroker) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const stage = url.searchParams.get("stage") || "";

    const supabase = await createClient();
    let query = supabase
      .from("leads")
      .select(
        "id, property_id, buyer_name, buyer_phone, buyer_email, message, assigned_broker_id, status, created_at"
      )
      .eq("assigned_broker_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (search) {
      const term = search.replace(/[%,]/g, "");
      query = query.or(`buyer_name.ilike.%${term}%,buyer_phone.ilike.%${term}%`);
    }
    if (stage) {
      query = query.eq("status", stage as LeadStage);
    }

    const { data, error } = await query;

    if (error) {
      return serverErrorResponse("BROKER LEADS LIST ERROR:", error);
    }

    return NextResponse.json({ leads: data });
  } catch (error) {
    return serverErrorResponse("BROKER LEADS LIST ERROR:", error);
  }
}
