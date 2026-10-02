import { NextResponse } from "next/server";
import { serverErrorResponse } from "@/lib/api/serverErrorResponse";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/supabase/getSessionProfile";
import { isLeadSource, type LeadSource, type LeadStage } from "@/lib/supabase/types";

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
    // Returns active AND archived rows, with `deleted_at` selected, so this
    // matches what app/admin/leads/page.tsx loads. The admin client splits
    // them by its Active/Archived view; the Active view still shows only
    // deleted_at = null. Previously this filtered archived rows out, which
    // meant the post-create refresh silently emptied the Archived view.
    // Admin-only route — the super_admin check above is unchanged.
    let query = supabase
      .from("leads")
      .select(
        "id, property_id, buyer_name, buyer_phone, buyer_email, message, assigned_broker_id, status, lead_source, assigned_at, contacted_at, next_action_at, budget_min, budget_max, configuration, preferred_locality, purpose, timeline, financing_status, created_at, deleted_at"
      )
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

    // Acquisition channel for a manually-logged lead.
    //
    // This is the entry point that matters most for attribution: WhatsApp
    // enquiries, referrals and walk-ins never touch /api/leads (which is
    // always 'website'), so this dropdown is the only place their real origin
    // is ever recorded.
    //
    // Omitting it is allowed and stores NULL — "not recorded" — because a
    // genuinely unknown origin should be left unknown rather than guessed at.
    // A value that is present but not on the allowlist is a malformed request
    // and is rejected, rather than being silently downgraded to NULL.
    let leadSource: LeadSource | null = null;
    const rawSource: unknown = body?.lead_source;
    if (rawSource !== undefined && rawSource !== null && rawSource !== "") {
      if (!isLeadSource(rawSource)) {
        return NextResponse.json({ error: "Invalid lead source" }, { status: 400 });
      }
      leadSource = rawSource;
    }

    const supabase = await createClient();
    // `assigned_at` is not set here: the leads_assignment_timestamp trigger
    // stamps it on INSERT whenever assigned_broker_id is non-null.
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
        lead_source: leadSource,
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
