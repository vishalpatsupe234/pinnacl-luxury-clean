import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/supabase/getSessionProfile";
import type { Database } from "@/lib/supabase/types";

type Params = { params: Promise<{ id: string }> };
type PropertyUpdate = Database["public"]["Tables"]["properties"]["Update"];

async function getOrCreateBuilderId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  builderName: string,
  adminId: string
): Promise<string | null> {
  const trimmed = builderName.trim();
  if (!trimmed) return null;

  const { data: existing } = await supabase
    .from("builders")
    .select("id")
    .ilike("name", trimmed)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("builders")
    .insert({ name: trimmed, created_by: adminId, verification_status: "pending" })
    .select("id")
    .single();

  if (error || !created) return null;
  return created.id;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { user, profile } = await getSessionProfile();
    if (!user || !profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    return NextResponse.json({ property: data });
  } catch (error) {
    console.error("ADMIN PROPERTY GET ERROR:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

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

    // Same precedence as the create route: an explicit builder_id
    // (dropdown selection) wins over the get-or-create-by-name path
    // used by "+ Add New Builder".
    let builderId: string | null | undefined = undefined;
    if (typeof body.builder_id === "string" && body.builder_id.trim()) {
      builderId = body.builder_id;
    } else if (typeof body.builder === "string" && body.builder.trim()) {
      builderId = await getOrCreateBuilderId(supabase, body.builder, user.id);
    }

    const update: PropertyUpdate = {};
    if (typeof body.title === "string") update.title = body.title.trim();
    if (builderId !== undefined) update.builder_id = builderId;
    if ("rera_number" in body) update.rera_number = body.rera_number || null;
    if ("status" in body) update.project_status = body.status;
    if ("city" in body) update.city = body.city || null;
    if ("locality" in body) update.locality = body.locality || null;
    if ("price" in body) update.price = body.price ? Number(body.price) : null;
    if ("price_display" in body) update.price_display = body.price_display || null;
    if ("description" in body) update.description = body.description || null;
    if (Array.isArray(body.images)) update.images = body.images;
    if ("featured" in body) update.is_featured = Boolean(body.featured);
    if ("property_type" in body) update.property_type = body.property_type || null;
    if ("bedrooms" in body) update.bedrooms = body.bedrooms ? Number(body.bedrooms) : null;
    if ("bathrooms" in body) update.bathrooms = body.bathrooms ? Number(body.bathrooms) : null;
    if ("area_sqft" in body) update.area_sqft = body.area_sqft ? Number(body.area_sqft) : null;
    if ("approval_status" in body) update.approval_status = body.approval_status;

    const { error } = await supabase
      .from("properties")
      .update(update)
      .eq("id", id);

    if (error) {
      console.error("ADMIN PROPERTY UPDATE ERROR:", error);
      return NextResponse.json({ error: String(error.message || error) }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("ADMIN PROPERTY UPDATE ERROR:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// Soft delete only — see the properties table's existing
// `deleted_at` convention ("no hard delete"). A real DELETE is
// never issued.
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { user, profile } = await getSessionProfile();
    if (!user || !profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("properties")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("ADMIN PROPERTY DELETE ERROR:", error);
      return NextResponse.json({ error: String(error.message || error) }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("ADMIN PROPERTY DELETE ERROR:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
