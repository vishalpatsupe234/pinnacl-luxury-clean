import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/supabase/getSessionProfile";
import type { ProjectStatus } from "@/lib/supabase/types";

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// Finds an existing builder by name (case-insensitive) or creates
// one, so the admin form can work with a plain "Builder" text
// field while the schema keeps a real builder_id relationship
// (see the migration's field-mapping note).
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

export async function GET(request: Request) {
  try {
    const { user, profile } = await getSessionProfile();
    if (!user || !profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "";

    const supabase = await createClient();
    let query = supabase
      .from("properties")
      .select(
        "id, title, slug, city, locality, property_type, price, price_display, bedrooms, bathrooms, area_sqft, rera_number, description, project_status, approval_status, is_featured, images, builder_id, created_at"
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(`title.ilike.%${search}%,city.ilike.%${search}%`);
    }
    if (status) {
      query = query.eq("project_status", status as ProjectStatus);
    }

    const { data, error } = await query;

    if (error) {
      console.error("ADMIN PROPERTIES LIST ERROR:", error);
      return NextResponse.json({ error: String(error.message || error) }, { status: 500 });
    }

    return NextResponse.json({ properties: data });
  } catch (error) {
    console.error("ADMIN PROPERTIES LIST ERROR:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, profile } = await getSessionProfile();
    if (!user || !profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const title = typeof body?.title === "string" ? body.title.trim() : "";

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Prefer a direct builder_id (chosen from the dropdown, which
    // is populated straight from the builders table) over the
    // get-or-create-by-name path, which exists only for the
    // form's "+ Add New Builder" flow.
    let builderId: string | null = null;
    if (typeof body?.builder_id === "string" && body.builder_id.trim()) {
      builderId = body.builder_id;
    } else if (typeof body?.builder === "string" && body.builder.trim()) {
      builderId = await getOrCreateBuilderId(supabase, body.builder, user.id);
    }

    const baseSlug = slugify(title) || "property";
    let slug = baseSlug;
    let attempt = 0;
    while (attempt < 5) {
      const { data: clash } = await supabase
        .from("properties")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!clash) break;
      attempt += 1;
      slug = `${baseSlug}-${attempt + 1}`;
    }

    const { data, error } = await supabase
      .from("properties")
      .insert({
        title,
        slug,
        source_broker_id: user.id,
        builder_id: builderId,
        rera_number: body?.rera_number || null,
        project_status: body?.status || "under_construction",
        city: body?.city || null,
        locality: body?.locality || null,
        price: body?.price ? Number(body.price) : null,
        price_display: body?.price_display || null,
        description: body?.description || null,
        images: Array.isArray(body?.images) ? body.images : [],
        is_featured: Boolean(body?.featured),
        property_type: body?.property_type || null,
        bedrooms: body?.bedrooms ? Number(body.bedrooms) : null,
        bathrooms: body?.bathrooms ? Number(body.bathrooms) : null,
        area_sqft: body?.area_sqft ? Number(body.area_sqft) : null,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("ADMIN PROPERTIES CREATE ERROR:", error);
      return NextResponse.json(
        { error: error ? String(error.message || error) : "Could not create property" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (error) {
    console.error("ADMIN PROPERTIES CREATE ERROR:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
