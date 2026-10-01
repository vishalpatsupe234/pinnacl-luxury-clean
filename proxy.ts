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

// Next.js matchers are anchored at the start of the pathname, so
// "/admin/:path*" matches /admin/leads but NOT /api/admin/leads/<id>. The two
// API entries below close that gap: gated PAGES were having their session
// refreshed on every navigation while the gated API ROUTES those pages call
// were not, so once an access token expired mid-session the next PATCH could
// fail its auth gate with 403 even though the page itself still rendered.
//
// This is a SESSION-REFRESH change only. The proxy performs no authorization
// — it calls getUser() and returns next(). Every route keeps its own
// super_admin / active-broker check and its own 403, and RLS is untouched.
//
// /api/leads is deliberately NOT listed: it is the public, anonymous enquiry
// endpoint and has no session to refresh.
export const config = {
  matcher: [
    "/broker/:path*",
    "/admin/:path*",
    "/api/broker/:path*",
    "/api/admin/:path*",
  ],
};
