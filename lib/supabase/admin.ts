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
// Used in exactly one place in this codebase: the broker
// accept-invite Route Handler, which must create a real
// auth.users record for an unauthenticated visitor — an operation
// no RLS policy can grant, since the visitor has no session yet.

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
