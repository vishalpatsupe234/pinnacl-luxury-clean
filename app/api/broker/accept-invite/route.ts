import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// The one Route Handler in this codebase that uses the service
// role key. Necessary because the visitor here has no session at
// all yet — there is no RLS-reachable path for an anonymous user
// to read an invite row or create their own auth.users record,
// by design (see supabase/migrations/..._broker_auth_invites.sql).
// Access control instead comes entirely from possessing a valid,
// unexpired, single-use token.

// GET: validate a token before showing the "set your password" form.
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");

  if (!token) {
    return NextResponse.json({ valid: false, error: "Missing token" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: invite } = await supabase
    .from("invites")
    .select("email, role, status, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!invite || invite.status !== "pending" || new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({ valid: true, email: invite.email, role: invite.role });
}

// POST: consume the token, create the real auth user + profile.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";

  if (!token || password.length < 8) {
    return NextResponse.json(
      { error: "Invalid token or password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { data: invite } = await supabase
    .from("invites")
    .select("id, email, role, status, expires_at, invited_by")
    .eq("token", token)
    .maybeSingle();

  if (!invite || invite.status !== "pending" || new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "This invite is invalid or has expired" }, { status: 400 });
  }

  // Create the real Supabase Auth user. This is the operation that
  // requires the service role key — no anon-key session can do this.
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: invite.email,
    password,
    email_confirm: true,
  });

  if (createError || !created?.user) {
    return NextResponse.json(
      { error: createError?.message || "Could not create account" },
      { status: 500 }
    );
  }

  // Broker/sales_partner accounts start pending_approval even
  // though the invite itself was admin-issued — the on-platform
  // approve/reject step (/admin/brokers) is still required before
  // dashboard access, per this task's explicit requirement.
  const { error: profileError } = await supabase.from("profiles").insert({
    id: created.user.id,
    role: invite.role,
    full_name: fullName || null,
    status: "pending_approval",
    invited_by: invite.invited_by,
  });

  if (profileError) {
    return NextResponse.json({ error: "Could not create profile" }, { status: 500 });
  }

  await supabase
    .from("invites")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      created_profile_id: created.user.id,
    })
    .eq("id", invite.id);

  return NextResponse.json({ ok: true });
}
