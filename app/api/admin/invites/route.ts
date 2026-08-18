import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/supabase/getSessionProfile";

const INVITE_EXPIRY_DAYS = 7;

// Creates an invite row. This is the ONLY path that can lead to a
// new broker/sales_partner account — there is no public signup
// anywhere in this app. No service-role key is used here: the
// caller's own authenticated session is checked against RLS
// (invites_admin_full_access requires is_super_admin()).
export async function POST(request: Request) {
  try {
    const { user, profile } = await getSessionProfile();

    if (!user || !profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const role = body?.role === "sales_partner" ? "sales_partner" : "verified_broker";

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("invites")
      .insert({
        email,
        role,
        token,
        invited_by: user.id,
        expires_at: expiresAt,
      })
      .select("id, email, role, token, expires_at")
      .single();

    if (error || !data) {
      console.error("INVITE API ERROR (insert):", error);
      return NextResponse.json(
        { error: error ? String(error.message || error) : "Could not create invite" },
        { status: 500 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    return NextResponse.json({
      ok: true,
      invite: {
        email: data.email,
        role: data.role,
        expiresAt: data.expires_at,
        inviteUrl: `${siteUrl}/broker/accept-invite?token=${data.token}`,
      },
    });
  } catch (error) {
    console.error("INVITE API ERROR:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

// Lists pending invites for the admin UI.
export async function GET() {
  const { user, profile } = await getSessionProfile();

  if (!user || !profile || profile.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invites")
    .select("id, email, role, status, expires_at, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Could not load invites" }, { status: 500 });
  }

  return NextResponse.json({ invites: data });
}
