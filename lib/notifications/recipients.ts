// Resolves WHO may receive an internal notification.
//
// Two rules, both deliberate:
//
//   1. An address is NEVER taken from a request body. Every recipient is
//      resolved from our own records, so a crafted request cannot redirect a
//      notification to an attacker-chosen inbox.
//
//   2. Eligibility is checked BEFORE the address is looked up. A suspended,
//      rejected, pending or soft-deleted account resolves to null and is
//      therefore unreachable by any notification in this system.
//
// WHY THE ADMIN AUTH API IS NEEDED HERE:
//
// public.profiles has NO email column — verified: its columns are id, role,
// full_name, phone, kyc_status, status, invited_by, deleted_at, created_at,
// updated_at. The address lives in auth.users, which is reachable only through
// the Admin Auth API with the service role.
//
// That makes this the THIRD use of createAdminClient() in the codebase, after
// accept-invite and the property lookup in /api/leads. Per the policy stated
// in lib/supabase/admin.ts, each use is an explicit least-privilege decision:
// here, resolving a teammate's own email address cannot be expressed as an RLS
// policy, because RLS governs public.* tables and not auth.users. The read is
// narrowed to one id at a time and the address never leaves the server — it is
// passed to Resend and never returned in an HTTP response or written to a log.

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** Roles that may be assigned a lead, and therefore may receive lead notifications. */
const NOTIFIABLE_BROKER_ROLES = ["verified_broker", "sales_partner"] as const;

/**
 * The founder's notification address.
 *
 * Deliberately OWNER_NOTIFICATION_EMAIL and not the super_admin's auth.users
 * email: the latter is an account-login identity that in this project is a
 * non-deliverable placeholder, while OWNER_NOTIFICATION_EMAIL is the address
 * /api/leads has been delivering owner notifications to since the beginning.
 * One convention, already proven.
 */
export function founderEmail(): string | null {
  return process.env.OWNER_NOTIFICATION_EMAIL || null;
}

/**
 * Resolves an eligible broker's email, or null.
 *
 * Returns null — never throws — for every ineligible case: unknown id, wrong
 * role, non-active status, soft-deleted profile, missing auth user, or an
 * auth user with no email. Callers treat null as "do not notify".
 *
 * `deleted_at is null` is included deliberately: a soft-deleted profile is not
 * a current teammate, even if its status still reads 'active'.
 */
export async function resolveBrokerEmail(brokerId: string): Promise<string | null> {
  if (!brokerId) return null;

  try {
    const admin = createAdminClient();

    // Eligibility first. If this fails, no address lookup happens at all.
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, role, status, deleted_at")
      .eq("id", brokerId)
      .is("deleted_at", null)
      .maybeSingle();

    if (profileError || !profile) return null;
    if (profile.status !== "active") return null;
    if (!(NOTIFIABLE_BROKER_ROLES as readonly string[]).includes(profile.role)) {
      return null;
    }

    const { data, error } = await admin.auth.admin.getUserById(brokerId);
    if (error || !data?.user?.email) return null;

    return data.user.email;
  } catch (err) {
    // Logged as a stage, with no id and no address.
    console.error(
      "notify_error",
      "recipient_resolve_failed",
      err instanceof Error ? err.message : "unknown error"
    );
    return null;
  }
}

/**
 * Resolves several brokers at once, de-duplicating ids and skipping ineligible
 * ones. Returns a Map of brokerId -> email containing only reachable brokers.
 *
 * Sequential rather than parallel: the set is a handful of teammates, and
 * serialising keeps the Admin Auth API usage trivially predictable.
 */
export async function resolveBrokerEmails(
  brokerIds: readonly string[]
): Promise<Map<string, string>> {
  const resolved = new Map<string, string>();

  for (const id of new Set(brokerIds.filter(Boolean))) {
    const email = await resolveBrokerEmail(id);
    if (email) resolved.set(id, email);
  }

  return resolved;
}
