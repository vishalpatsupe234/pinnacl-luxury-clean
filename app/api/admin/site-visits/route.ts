import { NextResponse } from "next/server";
import { serverErrorResponse } from "@/lib/api/serverErrorResponse";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/supabase/getSessionProfile";

// Site visit logging — admin side.
//
// public.site_visits already existed (20260816120100) with RLS from
// 20260816120200 and indexes on all three foreign keys. Nothing about the
// table, its policies or its indexes is changed here; this route is the first
// application code to reach it.
//
// APPEND-ONLY BY DESIGN. The table has no UPDATE and no DELETE policy for any
// role, including super_admin, so this file deliberately exposes only GET and
// POST. A recorded visit is immutable history — if a visit is logged wrongly,
// the correction is a lead note explaining it, not an edit.

/**
 * Parses the caller-supplied visit date.
 *
 * `visit_date` is the one timestamp that legitimately comes from the request:
 * a visit can be logged after the fact, or scheduled ahead, so it is neither
 * "now" nor derivable server-side. It is still never trusted verbatim — the
 * string is parsed, an unparseable or out-of-range value is rejected with a
 * 400 rather than reaching the column, and what gets stored is the normalised
 * ISO form of the parsed Date.
 *
 * Mirrors parseNextActionAt in the admin and broker lead routes.
 */
function parseVisitDate(value: unknown): { ok: true; value: string } | { ok: false } {
  if (typeof value !== "string" || value === "") return { ok: false };

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return { ok: false };

  return { ok: true, value: parsed.toISOString() };
}

export async function GET(request: Request) {
  try {
    const { user, profile } = await getSessionProfile();
    if (!user || !profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const leadId = new URL(request.url).searchParams.get("lead_id") || "";

    const supabase = await createClient();
    // Explicit column list rather than select("*"), matching every other
    // route in this project. property_id is returned as an id, not embedded
    // as properties(title): the hand-written Database type declares
    // `Relationships: []`, which collapses PostgREST embed inference to
    // `never`, and the admin UI already holds the property list it needs to
    // resolve the title locally.
    let query = supabase
      .from("site_visits")
      .select("id, lead_id, property_id, broker_id, visit_date, notes, created_at")
      .order("visit_date", { ascending: false });

    // Optional filter. Omitting it returns every visit, which
    // site_visits_read_own_or_admin already permits for super_admin.
    if (leadId) {
      query = query.eq("lead_id", leadId);
    }

    const { data, error } = await query;

    if (error) {
      return serverErrorResponse("ADMIN SITE VISITS LIST ERROR:", error);
    }

    return NextResponse.json({ siteVisits: data });
  } catch (error) {
    return serverErrorResponse("ADMIN SITE VISITS LIST ERROR:", error);
  }
}

export async function POST(request: Request) {
  try {
    const { user, profile } = await getSessionProfile();
    if (!user || !profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const leadId = typeof body.lead_id === "string" ? body.lead_id : "";
    const propertyId = typeof body.property_id === "string" ? body.property_id : "";

    if (!leadId) {
      return NextResponse.json({ error: "Lead is required" }, { status: 400 });
    }
    if (!propertyId) {
      return NextResponse.json({ error: "Property is required" }, { status: 400 });
    }

    const visitDate = parseVisitDate(body.visit_date);
    if (!visitDate.ok) {
      return NextResponse.json({ error: "A valid visit date is required" }, { status: 400 });
    }

    // notes is optional — site_visits.notes is nullable.
    const notes = typeof body.notes === "string" ? body.notes.trim() : "";

    const supabase = await createClient();

    // Both foreign keys are validated before the insert, for the same reason
    // the admin lead route validates assigned_broker_id: the FK constraints
    // would catch a bad id anyway, but only as a generic 500 via
    // serverErrorResponse. A malformed uuid raises 22P02 rather than
    // returning no rows, so the error branch is treated as "invalid" too —
    // that keeps the database error out of the response and returns a clean
    // 400 naming the field the caller got wrong.
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id")
      .eq("id", leadId)
      .maybeSingle();

    if (leadError || !lead) {
      return NextResponse.json({ error: "Invalid lead" }, { status: 400 });
    }

    // Soft-deleted properties are excluded, matching how the admin property
    // dropdown is populated in app/admin/leads/page.tsx. A visit cannot be
    // logged against an archived listing.
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("id")
      .eq("id", propertyId)
      .is("deleted_at", null)
      .maybeSingle();

    if (propertyError || !property) {
      return NextResponse.json({ error: "Invalid property" }, { status: 400 });
    }

    const { error } = await supabase.from("site_visits").insert({
      lead_id: lead.id,
      property_id: property.id,
      // broker_id comes from the SESSION, never from the request body —
      // the same rule the lead-notes route applies to author_id.
      //
      // It is also what makes this insert possible at all:
      // site_visits_broker_insert_own is `with check (broker_id = auth.uid())`
      // and there is no admin-insert policy on this table, so a visit can
      // only ever be attributed to the caller. Taking the value from the body
      // would let a caller attribute a visit to someone else, and RLS would
      // then reject it as a generic 500.
      //
      // CONSEQUENCE, worth knowing: this records visits the signed-in admin
      // conducted. Logging a visit carried out by a different broker is not
      // possible through any route while that policy is the only INSERT path.
      broker_id: user.id,
      visit_date: visitDate.value,
      notes: notes || null,
    });

    if (error) {
      return serverErrorResponse("ADMIN SITE VISIT CREATE ERROR:", error);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverErrorResponse("ADMIN SITE VISIT CREATE ERROR:", error);
  }
}
