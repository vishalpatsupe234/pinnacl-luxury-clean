// Browser-side Supabase client for Client Components.
// Uses only the public URL + publishable (anon) key — safe to
// ship to the browser bundle. Never import the service role key
// here or in any file reachable from client code.

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
