// SERVICE ROLE client — bypasses Row Level Security entirely.
//
// This file must NEVER be imported from a "use client" component,
// a browser-executed module, or anything that ends up in the
// client JS bundle. It is only safe to import from:
//   - Route Handlers (app/**/route.ts)
//   - Server Actions
//   - a module that itself carries `import "server-only"` and is reached
//     only from one of the above (currently just
//     lib/notifications/recipients.ts — see item 4 below)
// All of these run exclusively on the server; SUPABASE_SERVICE_ROLE_KEY
// (no NEXT_PUBLIC_ prefix) is never exposed to Next.js's client
// bundle by design.
//
// Used in exactly four places in this codebase (count corrected 2026-10-02;
// the header previously said "exactly two places, both Route Handlers", which
// was stale and understated the service role's reach). Each is an operation no
// RLS policy can grant to the caller:
//
//   1. app/api/broker/accept-invite/route.ts — Route Handler. Creates a real
//      auth.users record for an unauthenticated visitor, who has no session
//      for any policy to evaluate.
//
//   2. app/api/leads/route.ts — Route Handler. Resolves a property slug to its
//      id so a website enquiry can be attributed, without depending on
//      anonymous SELECT over public.properties. That read is narrowed in the
//      query itself (id only, approved, not soft-deleted) and the result never
//      leaves the server.
//
//   3. app/api/jobs/daily/route.ts — Route Handler. READ-ONLY queries for the
//      daily follow-up job. The job runs from Vercel Cron and so carries no
//      end-user session for RLS to evaluate. It issues SELECT only — it never
//      writes to leads or site_visits — and returns counts rather than rows,
//      so no lead data leaves the server.
//
//   4. lib/notifications/recipients.ts — NOT a Route Handler. This is the only
//      LIBRARY MODULE that uses the service role, and the exception is
//      deliberate: it resolves an internal recipient's email address from
//      auth.users, because public.profiles has no email column. RLS governs
//      public.* tables and cannot express a read of auth.users at all, so this
//      is not expressible as a policy. The read is narrowed to one id at a
//      time, is gated on profile eligibility first (active, correct role, not
//      soft-deleted), and the address is passed only to Resend — never
//      returned in an HTTP response and never logged.
//
//      Being a library module rather than a Route Handler is why the
//      `server-only` guard below matters more here than anywhere else: a
//      library is far easier to import from a client component by accident
//      than a route file is. That guard turns such a mistake into a build
//      error rather than a leaked key.
//
// Each addition to this list is an explicit least-privilege decision, not a
// convenience. Prefer the caller's own session and RLS
// (lib/supabase/server.ts) unless the operation genuinely cannot be expressed
// as a policy. If you add a fifth, update this list in the same change.

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
