import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refreshes the Supabase auth session cookie so Server Components
// under /broker and /admin always see an up-to-date session.
// Scoped narrowly via `config.matcher` below — the rest of the
// site (Hero, Featured Projects, etc.) never runs this proxy.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Touch the session so an expired token gets refreshed before
  // any gated Server Component runs.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/broker/:path*", "/admin/:path*"],
};
