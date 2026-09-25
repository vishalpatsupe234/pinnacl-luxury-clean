import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/supabase/getSessionProfile";
import type { ProfileStatus } from "@/lib/supabase/types";

type Params = { params: Promise<{ id: string }> };

type BrokerAction = "approve" | "reject" | "suspend";

// Each action declares the status the target row MUST already be in,
// and the status it moves to. Pinning the "from" status is what stops
// an action being replayed against the wrong lifecycle state — e.g.
// approve must never resurrect a rejected or suspended account, and
// suspend must never apply to a broker who was never approved.
// Typed as ProfileStatus, not string, so an invalid lifecycle value is a
// compile error rather than a runtime constraint violation.
const ACTION_TRANSITIONS: Record<
  BrokerAction,
  { from: ProfileStatus; to: ProfileStatus }
> = {
  approve: { from: "pending_approval", to: "active" },
  reject: { from: "pending_approval", to: "rejected" },
  suspend: { from: "active", to: "suspended" },
};

function isBrokerAction(value: unknown): value is BrokerAction {
  return value === "approve" || value === "reject" || value === "suspend";
}

// Approve or reject a broker in pending_approval, or suspend an active
// broker. Uses the caller's own authenticated session — no service role
// key — since super_admin already has full UPDATE access to `profiles`
// via RLS (profiles_admin_full_access), and the
// enforce_profile_role_change_admin_only() trigger independently
// requires auth.uid() to resolve to a super_admin before any status
// change is allowed. Only `status` is ever written: role and kyc_status
// are never touched, and no row is ever deleted.
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const { user, profile } = await getSessionProfile();

  if (!user || !profile || profile.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const action = body?.action;

  if (!isBrokerAction(action)) {
    return NextResponse.json(
      { error: "action must be 'approve', 'reject' or 'suspend'" },
      { status: 400 }
    );
  }

  // Self-suspend guard. There may be exactly one super_admin, and there
  // is no UI path to restore a suspended account, so allowing this would
  // be an unrecoverable lockout. Compared by profile id, which is the
  // primary key and equals auth.users.id — never by email.
  if (action === "suspend" && id === user.id) {
    return NextResponse.json(
      { error: "You cannot suspend your own account." },
      { status: 400 }
    );
  }

  const { from, to } = ACTION_TRANSITIONS[action];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ status: to })
    .eq("id", id)
    .eq("status", from)
    .select("id");

  if (error) {
    return NextResponse.json({ error: "Could not update broker status" }, { status: 500 });
  }

  // Zero matched rows is NOT success. It means the id does not exist, or
  // the row is not in the status this action requires (already suspended,
  // already approved, and so on). Previously this returned { ok: true }
  // and the caller could not tell that nothing had changed.
  if (!data || data.length === 0) {
    return NextResponse.json(
      { error: `No broker found with status '${from}' for this action.` },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true, status: to });
}
