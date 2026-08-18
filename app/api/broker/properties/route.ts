import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/supabase/getSessionProfile";
import type { ProjectStatus } from "@/lib/supabase/types";

// Read-only for approved brokers. Relies on the
// `properties_broker_read_all` RLS policy (active broker/
// sales_partner sees every property, not just their own) — this
// route itself performs no writes and exposes no mutation path.
export async function GET(request: Request) {
  try {
    const { user, profile } = await getSessionProfile();

    const isActiveBroker =
      profile &&
      (profile.role === "verified_broker" || profile.role === "sales_partner") &&
      profile.status === "active";
    const isAdmin = profile?.role === "super_admin";

    if (!user || !profile || !(isActiveBroker || isAdmin)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const city = url.searchParams.get("city") || "";
    const propertyType = url.searchParams.get("property_type") || "";
    const status = url.searchParams.get("status") || "";

    const supabase = await createClient();
    let query = supabase
      .from("properties")
      .select(
        "id, title, slug, city, locality, property_type, price, price_display, bedrooms, bathrooms, area_sqft, rera_number, description, project_status, approval_status, is_featured, images, created_at"
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(`title.ilike.%${search}%,city.ilike.%${search}%`);
    }
    if (city) {
      query = query.ilike("city", `%${city}%`);
    }
    if (propertyType) {
      query = query.eq("property_type", propertyType);
    }
    if (status) {
      query = query.eq("project_status", status as ProjectStatus);
    }

    const { data, error } = await query;

    if (error) {
      console.error("BROKER PROPERTIES LIST ERROR:", error);
      return NextResponse.json({ error: String(error.message || error) }, { status: 500 });
    }

    return NextResponse.json({ properties: data });
  } catch (error) {
    console.error("BROKER PROPERTIES LIST ERROR:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
