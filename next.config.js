const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;
const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
  : "";

// Built from this app's actual resources, not copied from a generic
// template — confirmed by grepping the codebase before writing this:
//   - fonts: next/font/google (Geist, Playfair) are self-hosted by
//     Next.js at build time; no runtime request to Google's font CDN.
//   - no Google Analytics/GTM anywhere in the app.
//   - no <iframe> anywhere; no Supabase Realtime/websocket usage.
//   - images: same-origin, the Supabase Storage host, and
//     images.unsplash.com (all already in `images.remotePatterns`).
//   - video (hero.mp4) is same-origin, served from /public.
//   - `script-src`/`style-src` need 'unsafe-inline': Next.js's App
//     Router injects unnonced inline <script> tags for RSC-hydration
//     data (the `self.__next_f.push(...)` pattern) and this app uses
//     two static JSON-LD <script> blocks (app/layout.tsx,
//     app/properties/[slug]/page.tsx) plus inline style props (e.g.
//     Navbar.tsx's motion-driven glass effect). A nonce-based CSP
//     would remove the need for 'unsafe-inline' but requires
//     propagating a per-request nonce through the proxy/middleware
//     and every Server/Client Component boundary — a materially
//     larger architectural change than "smallest safe hardening"
//     calls for here, so it's intentionally deferred.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: https://images.unsplash.com${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
  "font-src 'self'",
  `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
  "media-src 'self'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 16.3's `next dev` otherwise auto-appends an "agent
  // rules" block to this project's CLAUDE.md on every dev-server
  // start. CLAUDE.md here is a user-authored, permanent project
  // memory file, not the generic placeholder that feature assumes.
  agentRules: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      ...(supabaseHostname
        ? [
            {
              protocol: "https",
              hostname: supabaseHostname,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: csp,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
