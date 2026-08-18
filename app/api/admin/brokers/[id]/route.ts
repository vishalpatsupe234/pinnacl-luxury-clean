import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/supabase/getSessionProfile";

type Params = { params: Promise<{ id: string }> };

// Approve or reject a broker currently in pending_approval. Uses
// the caller's own authenticated session — no service role key —
// since super_admin already has full UPDATE access to `profiles`
// via RLS (profiles_admin_full_access).
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const { user, profile } = await getSessionProfile();

  if (!user || !profile || profile.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const action = body?.action;

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ status: action === "approve" ? "active" : "rejected" })
    .eq("id", id)
    .eq("status", "pending_approval");

  if (error) {
    return NextResponse.json({ error: "Could not update broker status" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
