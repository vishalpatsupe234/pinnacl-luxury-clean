// SERVICE ROLE client — bypasses Row Level Security entirely.
//
// This file must NEVER be imported from a "use client" component,
// a browser-executed module, or anything that ends up in the
// client JS bundle. It is only safe to import from:
//   - Route Handlers (app/**/route.ts)
//   - Server Actions
// Both run exclusively on the server; SUPABASE_SERVICE_ROLE_KEY
// (no NEXT_PUBLIC_ prefix) is never exposed to Next.js's client
// bundle by design.
//
// Used in exactly two places in this codebase, both Route Handlers,
// both for operations no RLS policy can grant to the caller:
//
//   1. app/api/broker/accept-invite/route.ts — creates a real
//      auth.users record for an unauthenticated visitor, who has no
//      session for any policy to evaluate.
//
//   2. app/api/leads/route.ts — resolves a property slug to its id so
//      a website enquiry can be attributed, without depending on
//      anonymous SELECT over public.properties. That read is narrowed
//      in the query itself (id only, approved, not soft-deleted) and
//      the result never leaves the server.
//
// Each addition to this list is an explicit least-privilege decision,
// not a convenience. Prefer the caller's own session and RLS
// (lib/supabase/server.ts) unless the operation genuinely cannot be
// expressed as a policy.

import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
