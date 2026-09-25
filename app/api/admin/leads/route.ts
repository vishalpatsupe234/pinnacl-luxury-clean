import { NextResponse } from "next/server";
import { serverErrorResponse } from "@/lib/api/serverErrorResponse";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/supabase/getSessionProfile";
import type { LeadStage } from "@/lib/supabase/types";

// Admin has full access to every lead — enforced by the existing
// leads RLS (leads_broker_read_assigned/leads_broker_update_assigned
// both OR in is_super_admin()). Nothing here changes that policy.
export async function GET(request: Request) {
  try {
    const { user, profile } = await getSessionProfile();
    if (!user || !profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const stage = url.searchParams.get("stage") || "";
    const brokerId = url.searchParams.get("broker_id") || "";

    const supabase = await createClient();
    let query = supabase
      .from("leads")
      .select(
        "id, property_id, buyer_name, buyer_phone, buyer_email, message, assigned_broker_id, status, created_at"
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (search) {
      const term = search.replace(/[%,]/g, "");
      query = query.or(`buyer_name.ilike.%${term}%,buyer_phone.ilike.%${term}%,buyer_email.ilike.%${term}%`);
    }
    if (stage) {
      query = query.eq("status", stage as LeadStage);
    }
    if (brokerId) {
      query = query.eq("assigned_broker_id", brokerId);
    }

    const { data, error } = await query;

    if (error) {
      return serverErrorResponse("ADMIN LEADS LIST ERROR:", error);
    }

    return NextResponse.json({ leads: data });
  } catch (error) {
    return serverErrorResponse("ADMIN LEADS LIST ERROR:", error);
  }
}

// Manual lead entry (e.g. a phone-in enquiry the admin logs by
// hand). Public web-form leads still arrive via the pre-existing
// /api/leads endpoint — untouched, out of scope for this phase.
export async function POST(request: Request) {
  try {
    const { user, profile } = await getSessionProfile();
    if (!user || !profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const buyerName = typeof body?.buyer_name === "string" ? body.buyer_name.trim() : "";

    if (!buyerName) {
      return NextResponse.json({ error: "Buyer name is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("leads")
      .insert({
        buyer_name: buyerName,
        buyer_phone: body?.buyer_phone || null,
        buyer_email: body?.buyer_email || null,
        message: body?.message || null,
        property_id: body?.property_id || null,
        assigned_broker_id: body?.assigned_broker_id || null,
        status: "new",
      })
      .select("id")
      .single();

    if (error || !data) {
      return serverErrorResponse("ADMIN LEADS CREATE ERROR:", error ?? "Could not create lead");
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (error) {
    return serverErrorResponse("ADMIN LEADS CREATE ERROR:", error);
  }
}
