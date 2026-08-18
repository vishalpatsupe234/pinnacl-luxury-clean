import "server-only";
import { createClient } from "./server";

// Shared server-side helper: who is logged in, and what is their
// profile (role/status)? Used by every gated broker/admin page and
// Route Handler so the access-control logic lives in exactly one
// place rather than being re-implemented per route.
export async function getSessionProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, status, kyc_status, full_name")
    .eq("id", user.id)
    .single();

  return { user, profile: profile ?? null };
}
