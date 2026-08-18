# PINNACL PROPERTIES — MASTER CONTEXT

_This file is the single permanent project memory and the operating manual for Pinnacl Properties. Do not create a second memory file. If this file conflicts with another document, report the conflict — do not guess which is correct. Anything not directly observable in the repository is marked UNKNOWN rather than invented._

_Every claim in this file is labeled **Implemented**, **Approved (architecture decision, not yet built)**, or **Planned/Vision**. Never assume a labeled item exists in running code without checking its label — §6, §7, §8, and §11 in particular describe target architecture, not shipped features._

_Last compiled: 2026-08-17. Git HEAD at time of writing: `cbc6446f` on branch `stable`, with a large volume of uncommitted local changes — see §3 and §9. Always run `git status` before assuming what is actually deployed; nothing described as "Implemented" in this file has been committed since `cbc6446f`._

_Environment note: no Supabase CLI, `psql`, or Docker is available in this working environment. All Supabase/Postgres work in this file (schema migrations, RLS, and the broker authentication below) has been written and, where applicable, compiled/type-checked/built successfully — but migration files have never been executed against the live Supabase project from this environment, and cannot be until CLI/DB access exists. "Implemented" below means "implemented in application code and passes `npm run build`," not "confirmed running against the live database." Apply the SQL migrations manually (`supabase db push` or the Supabase Dashboard SQL editor) before relying on this in production._

---

## 1. Project Identity

**Vision:** Build India's most trusted, calm, technology-driven luxury real estate brand.

**Ownership:** Sole proprietor-owned and controlled. Every architecture decision in this file — including the long-term community-brokerage model in §6 — is designed around a single owner retaining strict, permission-gated control as the platform grows, not distributed governance.

**Positioning:** A boutique luxury real estate consultancy — never a generic broker or listings-portal experience.

**Long-term business vision (Approved direction, not yet built):** Pinnacl is intended to evolve from a single-advisor lead-generation website into an **invite-only community brokerage network** — a closed ecosystem of verified agents and builder partners operating under one owner's platform, with transparent, configurable commission-sharing on deals that originate through it. See §6 (Business Architecture) and §11 (Pinnacl 2030 Vision) for the full specification. **Nothing in §6/§7 (beyond Phase 1)/§8/§11 is implemented in code today** — the current codebase is a marketing and lead-generation front-end only.

**Brand philosophy — three pillars, applied to every surface:**
- **Luxury** — restraint over decoration; one decisive gesture per screen; explicit rejection of broker-site tropes (badges, urgency language, saturated color, competing CTAs).
- **Simplicity** — a calm, guided, uncluttered experience from first visit through enquiry.
- **Trust** — evidence-based positioning only, never aspirational claims presented as fact; verification before scale.

**Target audience:**
- Primary (long-term ambition, not a current client-base claim): HNI/UHNWI, business owners, CXOs, doctors/lawyers, NRIs, investors, luxury home buyers.
- Secondary (current-stage reality): financially qualified premium buyers matching the Ambernath-stage market actually being served.

**Things that must never be violated:**
- Never claim scale, clients, transactions, inventory, or partnerships that are not actually true (DEC-005). **Currently violated live on `/about` — see §9, Critical.**
- Gold is an accent only — never a dominant or decorative element (DEC-009).
- RERA claims must be property-specific and verified — never a blanket/site-wide badge (DEC-011). **Currently violated live in `Footer.tsx` — see §9, Critical.**
- Major design/architecture decisions require explicit owner approval before implementation (DEC-014).
- Named reference brands — Douglas Elliman, Savills, DAMAC, Emaar, Sotheby's International Realty, Compass, Oppenheim Group (DEC-015) — are quality/UX benchmarks only, never copied directly.
- No gradients, glow effects, or "cheap UI" on interactive elements. **Currently violated live in `PropertyDetails.tsx` — see §9, Medium.**
- No mass-market or listings-portal framing language ("browse our inventory") — prefer advisory framing ("begin a private consultation").

**Current implementation stage:** MVP, pre-production. Homepage, `/about`, `/contact`, and `/projects` are genuinely polished; `/properties` and `/properties/[slug]` contain verified live bugs and off-brand styling (§9). Inventory is 3 placeholder listings in a static JSON file, not a real database (§7, Phase 1). The self-governance docs (`PROJECT_CONTEXT.md`, `DECISIONS.md`, `TASKS.md`) are stale since 2026-07-12 and not kept in sync with work completed after that date.

---

## 2. Design System

### Colors (Implemented)

| Token | Value | Usage |
|---|---|---|
| `--color-brand-bg` | `#F8F7F3` | Page background (off-white) |
| `--color-brand-surface` | `#FFFFFF` | Cards, surfaces |
| `--color-brand-border` | `#E6E2D8` | Hairline borders/dividers |
| `--color-brand-black` | `#111111` | Primary text, dark backgrounds |
| `--color-brand-muted` | `#7C7C76` | Secondary/muted text |
| `--color-brand-gold` | `#C9A66A` | Accent — the single most important brand color |
| `--color-brand-gold-soft` | `#B79A67` | Secondary gold tone |

Palette is black / off-white / brand gold, with warm neutrals as the only permitted extension. **Gold is accent-only, never a dominant fill**, with one documented, approved exception: the Hero's floating Enquire button (solid gold, by explicit request to match a supplied reference image).

**Verified bug (not a style choice):** `PropertyDetails.tsx` references `var(--color-brand-soft)` twice (a "Featured Property" badge, and an enquiry-form card background). This token **does not exist anywhere in `app/globals.css`** — confirmed by direct grep of the full file. It is a different name from the real `--color-brand-gold-soft` token. Both surfaces currently render with a missing/undefined background as a result. See §9, Medium.

A second, unreconciled CSS token system exists in `app/globals.css`: `shadcn@latest init` added its own oklch-based token set (`--background`, `--foreground`, `--primary`, `--border`, `--radius`, etc.) alongside the tokens above. This overwrote the original `:root { --background: var(--color-brand-bg); ...}` mapping, so `body`'s base background/text color has visibly shifted from the brand tokens toward shadcn's neutral defaults. Owner was informed and chose to proceed and reconcile later. See §9, Medium.

### Typography (Implemented, with an open decision gap)

`--font-serif` = Playfair Display (`next/font/google`), used for all headings. `--font-sans` = **Geist Sans** (`next/font/google`), used for body copy — this is the actual code today.

**Open, unresolved decision:** DEC-008 approved "Playfair Display + Inter" as the typography system. The code has never been switched to Inter — Geist remains in place. This is a live contradiction between an approved decision and shipped code (`TASKS.md` T-006). Do not assume Inter is in use anywhere in the app.

**Verified inconsistency:** `PropertyDetails.tsx` uses a raw `font-playfair` class instead of the `font-serif` token every other component uses — same visual font, inconsistent mechanism. See §9, Low.

### Motion Language (Implemented)

Two deliberate categories, not one global duration:

- **UI interactions:** 240–300ms `ease-out`. Applies to Navbar hover, buttons, the gold underline, the floating Enquire icon, and Navbar glass state changes.
- **Editorial content reveals:** 550–650ms `ease-out`. Applies only to viewport-triggered reveals — currently `FeaturedProjects.tsx` and `WhyPinnacl.tsx` (both: opacity 0→1, `translateY` 20px→0, ~600ms, 80ms stagger, `ease: [0.22,1,0.36,1]`, `viewport={{ once: true, amount: 0.2 }}`). No scale, rotate, bounce, blur, or glow in either category.

`prefers-reduced-motion` is respected independently in two places: Lenis's own `respectReducedMotion: true` (global scroll — forces 1:1 native-feeling scroll and instant programmatic scrolls), and `useReducedMotion()` from `motion/react` in every component using `motion` (Navbar, Featured Projects, Why Pinnacl) — disabling the animation entirely, not just speeding it up. This is currently handled in JS in exactly those three places; any future `motion` adoption must repeat this pattern, since the global CSS reduced-motion rule does not reach `motion`-driven (Web Animations API) animation.

The global `.animate-fade-in` keyframe (`fadeInUp`, 1s) drives Hero content entrance and remains a pre-existing plain-CSS exception outside both categories, not yet folded into this framework.

**Verified inconsistency:** `ProjectsGrid.tsx` (used on `/projects`) has no motion reveal at all, unlike its sibling homepage sections. See §9, Low.

### UX Rules (Implemented, extends the above)

- **Navigation:** No logo in the top nav; on the home page, nav text/links reveal only on scroll past 60px; no more than 4 primary nav items visible at once.
- **Buttons:** One primary gesture per screen. `.btn-gold-outline` (outline, transparent fill) for in-content CTAs; solid gold reserved for the floating Enquire action only. This is fully implemented across `EnquirySection`, `/contact`, and the Hero. **One known, deliberately deferred exception remains:** `PropertyDetails.tsx`'s lower enquiry-form submit button is still a solid-gold fill (`bg-[var(--color-brand-gold)] text-white`).
- **Cards:** Restrained hover (opacity/border shift only), no heavy shadows, conservative rounding (`rounded-sm`/`rounded-2xl` at most). **Verified violation:** `PropertyCardLux.tsx` (used on `/properties`) uses `shadow-xl`, heavy `rounded-2xl`, and a `group-hover:scale-105` image-zoom hover — none of which match this rule or any other card in the app. See §9, Medium.
- **Photography:** Real, polished, grounded imagery preferred over stock. The hero video's craft (mismatched clips, no unified grade, handheld camera) was flagged as below brand bar in a prior creative review and remains unresolved. `FeaturedProjects.tsx` and `ProjectsGrid.tsx` fall back to remote Unsplash stock images when a local property photo isn't available.
- **Spacing:** Generous, editorial. No cramped stacks of competing elements — the Hero was deliberately simplified to enforce this.
- **Hero:** Search-first, one clear CTA. No trust badges unless property-specific and verified. No video/image asset without a poster fallback.
- **Forms:** All 4 independent form implementations (`EnquirySection`, `/contact`, `PropertyDetails`, plus the Hero's WhatsApp deep link as a distinct mechanism) lack full loading/success/error state differentiation beyond a basic submit-disable.
- **Floating actions:** Exactly one floating action element (Enquire), gold, appears only after scroll on the home page — no second competing floating element.

---

## 3. Technical Architecture

**Stack (Implemented):** Next.js 16.1.4 (App Router, Turbopack), React 19.2.0, TypeScript 5, Tailwind CSS v4.

**Routing — 7 page routes + 2 API routes + 2 metadata routes:**

| Route | Purpose | Navbar/Footer? |
|---|---|---|
| `/` | Primary entry — search-first Hero, curation, lead capture | Yes |
| `/projects` ("Collections") | Curated project portfolio browse | Yes |
| `/about` ("Our Story") | Trust-building, brand narrative | Yes |
| `/contact` ("Enquire") | Dedicated lead-generation form | Yes |
| `/properties` | Full filterable inventory browse | **No — verified navigation gap** |
| `/properties/[slug]` | Single-listing conversion page | **No — verified navigation gap** |
| `/locations/[location]` | Pure server redirect to `/properties?loc=...` | N/A, no render |

`/projects` and `/properties` are two structurally different, unreconciled UIs over the same underlying data (§9). No standalone `/locations` index page exists, only the dynamic redirect — explicitly should not be assumed or linked until confirmed with the owner. **Journal (blog)** does not exist as a route; a nav-rename proposal to add it was explicitly declined by the owner (see §10).

**Data flow — three inconsistent access patterns to the same data (verified):**
1. `app/page.tsx` and `app/projects/page.tsx` import `data/properties.json` directly at request time, bypassing the API entirely.
2. `app/properties/page.tsx` and `app/properties/[slug]/page.tsx` fetch `GET /api/properties` via an absolute HTTP URL built from `NEXT_PUBLIC_SITE_URL`, server-to-self — a real inefficiency and a hard failure point if that env var is ever misconfigured (no fallback).
3. `PropertiesList.tsx` (client-side) re-fetches the same API whenever filters change, syncing state to the URL via `useSearchParams`.

**State management:** No global state library. Each of the 4 lead forms manages its own local `useState` independently — a duplication debt, not a missing capability.

**API routes (both real, not stubs):**
- `GET /api/properties` — reads and in-memory caches `data/properties.json` (5-minute TTL); supports `slug` (single lookup), `search`/`q`, `type`, `loc`, `min`, `max`, `budget` (alias for `max`), `status`. No pagination; no bounds-checking on query params.
- `POST /api/leads` — reads a Google service-account key from disk, authenticates via `googleapis`, initializes a header row in the target Sheet if absent, appends the lead row, sends an HTML owner-notification email via `resend`. Requires `GOOGLE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_KEY_PATH`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `OWNER_NOTIFICATION_EMAIL` — fails with 500 if any are missing. Logs verbose step-by-step info to console, including the spreadsheet ID. **Verified: no rate-limiting, no input validation, and raw request-body fields (`name`, `phone`, `email`, `location`, `message`) are interpolated directly into the outbound HTML email with no escaping** — a real HTML-injection vector. See §9, Critical.

**Lead flow (site-wide):** Four independent form implementations all POST to `/api/leads` — `EnquirySection`, `/contact`, `PropertyDetails` — plus the Hero's floating button, which instead opens a `wa.me` WhatsApp deep link (a different mechanism, not a form submission). All leads currently flow to one owner email/Sheet with no per-agent routing or ownership concept (see §6, Lead Ownership).

**Smooth scroll (Implemented):** `lenis`, wired globally via `components/SmoothScroll.tsx` — a minimal client component that instantiates/destroys a `lenis` instance in `useEffect` and renders `{children}` with no DOM wrapper, imported once into `app/layout.tsx` (necessary because the root layout is a Server Component and Lenis requires `useEffect`). Configuration: `lerp: 0.08`, `smoothWheel: true`, `syncTouch: false`, `autoRaf: true`, `respectReducedMotion: true`. The conflicting native `html { scroll-behavior: smooth; }` rule was removed from `globals.css` in the same effort; grep confirmed no other `scroll-behavior`/`scrollBehavior` source exists anywhere in the project — Lenis is the sole smooth-scroll system.

**SEO (Implemented):** Per-page metadata (title/description/canonical/OG/Twitter) on all 6 content routes. Organization + WebSite JSON-LD in `app/layout.tsx`. RealEstateListing JSON-LD on `/properties/[slug]`. Dynamic `sitemap.ts` (5 static entries + one per property item). `robots.ts` allows all, disallows `/api/`.

**Verified security note, relevant to §6/§8's future uploads:** `/properties/[slug]/page.tsx` renders JSON-LD via `dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}`. `JSON.stringify` escapes quotes/control characters but not `<` or `/`, so a field containing `</script>` could break out of the script tag. Low risk today because `data/properties.json` is static and owner-edited only — **this becomes a real vulnerability the moment property data becomes agent/builder-submitted**, which is explicitly part of the §6/§11 vision. Must be resolved before any upload feature ships, not after.

**Render tree (verified against current source):**

```
app/layout.tsx
 └── SmoothScroll (Lenis wrapper, no DOM element)
      ├── app/page.tsx                     → "/"
      │    ├── Navbar
      │    ├── Hero
      │    │    └── HeroMedia
      │    ├── FeaturedProjects
      │    ├── WhyPinnacl
      │    ├── EnquirySection
      │    └── Footer
      │
      ├── app/about/page.tsx                → "/about"
      │    ├── Navbar, (inline content, incl. §9 stat-claim issue), EnquirySection, Footer
      │
      ├── app/contact/page.tsx              → "/contact"
      │    ├── Navbar, (inline form), Footer
      │
      ├── app/projects/page.tsx             → "/projects"
      │    ├── Navbar, ProjectsGrid, EnquirySection, Footer
      │
      ├── app/properties/page.tsx           → "/properties"   [no Navbar/Footer]
      │    └── PropertiesClient (Suspense) → PropertiesList → PropertyCardLux (mapped)
      │
      ├── app/properties/[slug]/page.tsx    → "/properties/:slug"   [no Navbar/Footer]
      │    └── PropertyDetails
      │
      └── app/locations/[location]/page.tsx → redirect() only, no render

app/sitemap.ts, app/robots.ts   → metadata routes, no components
app/api/properties/route.ts     → GET, no rendering
app/api/leads/route.ts          → POST, no rendering

-- Broker/Admin authentication (new, see "Authentication" below) --
app/broker/login/page.tsx           → "/broker/login"          [no Navbar/Footer — standalone auth page]
app/broker/accept-invite/page.tsx   → "/broker/accept-invite"  [no Navbar/Footer]
app/broker/dashboard/page.tsx       → "/broker/dashboard"      [gated, no Navbar/Footer]
app/admin/brokers/page.tsx          → "/admin/brokers"         [gated, no Navbar/Footer]
app/api/admin/invites/route.ts      → GET/POST, no rendering
app/api/broker/accept-invite/route.ts → GET/POST, no rendering
app/api/admin/brokers/[id]/route.ts → PATCH, no rendering
proxy.ts (project root)             → session-refresh, scoped to /broker/* and /admin/* only
```

### Authentication (Implemented, code-level — see environment note above)

Real Supabase Auth-backed authentication now exists, strictly scoped to the invite-only broker/admin flow. **No public signup path exists anywhere in this app** — the only way a `verified_broker`/`sales_partner` `profiles` row can come into existence is via the invite-token flow below.

**Supabase client utilities (`lib/supabase/`):**
- `client.ts` — browser client (anon/publishable key only, safe for client bundles).
- `server.ts` — server client for Server Components/Route Handlers (anon key + cookies via `@supabase/ssr`; access control comes from RLS, not this client).
- `admin.ts` — **service-role client. Used in exactly one place in the codebase** (`app/api/broker/accept-invite/route.ts`'s account-creation step) — guarded with the `server-only` package so importing it from any client-reachable file is a build-time error, not just a convention. `SUPABASE_SERVICE_ROLE_KEY` (no `NEXT_PUBLIC_` prefix) lives only in `.env.local`.
- `getSessionProfile.ts` — shared helper (current user + their `profiles` row), reused by every gated page/route instead of re-implementing the check per file.
- `types.ts` — hand-written `Database` type (no Supabase CLI available to generate it). Only `profiles` and `invites` are fully typed; the other 6 business-data tables from the Curated Broker Network migration are typed generically since this task didn't touch them. Regenerate properly once CLI access exists.

**Flow:** Super Admin (`/admin/brokers`) creates an invite (email + role) → a random 32-byte token is stored in `invites`, 7-day expiry → admin shares the resulting link manually (no email-sending was built — out of scope) → broker visits `/broker/accept-invite?token=...`, sets a password → the accept-invite Route Handler (service role) creates the real `auth.users` record and a `profiles` row with `status: 'pending_approval'` → broker cannot reach `/broker/dashboard` until Super Admin approves them via `/admin/brokers` (flips `status` to `active`, or `rejected`) → `/broker/login` is the single shared sign-in page for both brokers and admins, redirecting by role after `signInWithPassword`.

**Migration:** `supabase/migrations/20260817090000_broker_auth_invites.sql` — extends the existing `profiles` table (adds a distinct `rejected` status value to the existing `pending_approval | active | suspended` check constraint) and adds a new `invites` table with its own RLS (admin-only; deliberately unreachable by `anon` or non-admin `authenticated` — token validation for an unauthenticated visitor is handled entirely by the service-role Route Handler, not RLS). **Decided directly with the owner not to create a separate `broker_profiles` table**, since it would have duplicated the existing `profiles` schema from the prior Curated Broker Network migration.

**New dependencies:** `@supabase/supabase-js`, `@supabase/ssr`, `server-only`.

**Next.js 16 note:** `middleware.ts` is deprecated in favor of `proxy.ts` (same behavior, renamed file + exported function). This project now uses `proxy.ts`.

**Explicitly out of scope for this task, still Planned:** properties, deals, commission ledger, and payments are not wired to any UI — `/broker/dashboard` is a placeholder that only proves the approval-gate works.

---

## 4. Folder Architecture

- **`app/`** — Routes, layouts, API routes, metadata routes (`sitemap.ts`, `robots.ts`). `app/layout.tsx` sets fonts, Organization+WebSite JSON-LD, and wraps every route in `SmoothScroll`.
- **`components/`** — Flat structure, ~29 files: ~13 active (§5), ~16 orphaned (zero imports, §5), plus `components/layout/` (2 unused primitives) and `components/lib/` (1 dead duplicate data file).
- **`components/SmoothScroll.tsx`** — Client component that instantiates/destroys the global `lenis` instance. Imported exactly once, in `app/layout.tsx`.
- **`components/ui/`** — shadcn/Base UI-generated primitives: `button.tsx`, `dialog.tsx`, `input.tsx`, `textarea.tsx`. Use `class-variance-authority` + `@base-ui/react` (this shadcn CLI version, `4.18.0`, uses Base UI, not Radix). **Experimental — zero page imports anywhere.** Blocked on reconciling the CSS token conflict (§2) before first real use.
- **`lib/`** — `lib/properties.ts` is a dead duplicate data file (zero imports). `lib/.env.local` holds env vars and is tracked in git — no live secrets currently confirmed present (only `NEXT_PUBLIC_SITE_URL`/`RESEND_FROM_EMAIL` in the tracked copy per prior review), but the pattern itself is a standing risk (§9).
- **`lib/utils.ts`** — shadcn's generated `cn()` class-merging helper (`clsx` + `tailwind-merge`).
- **`lib/supabase/`** — `client.ts`, `server.ts`, `admin.ts` (service-role, server-only), `getSessionProfile.ts`, `types.ts`. See §3 "Authentication."
- **`app/broker/`, `app/admin/`** — the invite-only broker/admin authentication routes. See §3 "Authentication."
- **`app/api/admin/`, `app/api/broker/`** — Route Handlers backing the auth flow. See §3 "Authentication."
- **`proxy.ts`** (project root) — Next.js 16's renamed `middleware.ts` convention; scoped to `/broker/*` and `/admin/*` only via `config.matcher`.
- **`supabase/`** — `migrations/` (4 files: the original 8-table Curated Broker Network schema, then the broker-auth extension) and `seed.sql`. Never executed against the live project from this environment — see the environment note at the top of this file.
- **`data/`** — `data/properties.json`, the single source of truth for property inventory: **3 placeholder listings (Pinnacl Crest, Aurelia, Bayview), not a real database.** `priceDisplay` fields currently render mojibake (`â‚¹` instead of `₹`) on every listing.
- **`public/`** — Static assets:

  | Asset | Status |
  |---|---|
  | `video/hero.mp4` (1920×1080, 23.9s, 24.4MB) | Active — Hero background, 0.6x playback; craft flagged low in a prior review |
  | `hero-poster.jpg` (1920×1080, 69KB) | Active — video poster |
  | `logo/pinnacl-logo-transparent.png`, `logo/pinnacl-logo.png` | Unused — logo was removed from Navbar |
  | `hero.jpg`, `about-1.jpg`, `testimonials/*.jpg` (3 files) | Unused — orphaned alongside the components that referenced them |
  | `properties/*.{jpg,webp}` | Referenced only by placeholder data |

- **`docs/reference/`** — 6 legacy markdown docs (AI_ASSISTANT, AI_HANDOFF, COMPONENT_INVENTORY, DESIGN_SYSTEM, LUXURY_BRAND_GUIDELINES, TECHNICAL_ARCHITECTURE); some content stale relative to current implementation.
- **`scripts/`** — `convert-to-webp.js`, a one-off `sharp`-based image-conversion utility.
- **`types/`** — `react-slick.d.ts`, a type declaration for the unused `react-slick` dependency.
- **`components.json`** — shadcn CLI config: `style: base-nova`, `baseColor: neutral`, `iconLibrary: lucide`, path aliases under `@/components`, `@/lib`, `@/hooks`.
- **`styles/`** — Does not exist as a folder. All styling lives in `app/globals.css` and inline Tailwind classes.

---

## 5. Component Inventory

**Active:**

| Component | Status | Purpose | Notes |
|---|---|---|---|
| `Navbar` | Active | Nav, glass states, hover, gold underline | High quality |
| `Hero` | Active | Video hero, search panel, floating Enquire | Video asset craft flagged elsewhere, unresolved |
| `HeroMedia` | Active | Generic image/video background layer | Clean, genuinely reusable |
| `FeaturedProjects` | Active | Homepage card grid, editorial motion reveal | High quality |
| `WhyPinnacl` | Active | 4-pillar grid, editorial motion reveal | High quality |
| `EnquirySection` | Active | Lead form + WhatsApp link | No full loading/error UX differentiation |
| `Footer` | Active | Site footer | **Carries a blanket RERA claim — verified DEC-011-adjacent risk, §9** |
| `ProjectsGrid` | Active | Collections card grid | No motion reveal (inconsistent with siblings) |
| `PropertiesClient` | Active | Suspense wrapper for `/properties` | Clean |
| `PropertiesList` | Active | Filter sidebar + fetch logic | **References CSS classes (`card-surface`, `btn-primary-hero`, `btn-outline`) that don't exist in `globals.css` — filter panel renders unstyled, §9** |
| `PropertyCardLux` | Active | Listing card on `/properties` | Off-brand shadow/scale/rounding vs. every other card, §9 |
| `PropertyDetails` | Active | Single-property page | Broken CSS var, gradient, off-palette green, raw font class, dead "Schedule Visit" button, broken WhatsApp number — §9 |
| `SmoothScroll` | Active | Global Lenis instantiation | Clean |

**Experimental (installed capability, not yet used on any page):**

| Component | Status | Purpose | Notes |
|---|---|---|---|
| `components/ui/button.tsx`, `dialog.tsx`, `input.tsx`, `textarea.tsx` | Experimental | shadcn/Base UI primitives | Blocked on CSS token reconciliation before first use |

**Orphan (zero imports anywhere — confirmed by grep):**

`FeaturedProperties`, `FloatingAction`, `PropertyCardA`, `PropertyCardB`, `WhyPinnaclProperties`, `AboutPinnacl`, `Collaboration`, `CTA`, `Testimonials`, `LuxurySearchBar`, `PropertyGallery`, `FeaturedA`, `FeaturedB`, `FeaturedC`, `components/layout/Container.tsx`, `components/layout/Section.tsx` — 16 files. Disposition (archive/delete/keep) is an explicit open owner decision, not yet made. Content of most of these has not been re-read in the latest audit — treat any description of them beyond "zero imports, legacy" as UNKNOWN. **Note:** `FloatingAction.tsx` received real edits in an earlier session before its orphan status was discovered — those edits are currently inert; the real floating button lives inline in `Hero.tsx`.

**Dead data files:** `lib/properties.ts`, `components/lib/properties.ts` — duplicate hardcoded property data, neither imported anywhere.

---

## 6. Business Architecture — Community Brokerage System

**Status: Approved long-term direction, mostly still design specification.** As of 2026-08-17, the invite-only account/approval mechanics (Access Policy below) are real, working code — see §3 "Authentication." Property ownership, lead ownership, site visit logs, deal closure, and the commission ledger remain Planned/schema-only (migrated as SQL but not wired to any UI). Check each subsection's own status label below rather than assuming the whole section is either fully built or fully unbuilt.

### Roles (schema exists; enforcement partially Implemented — see §3)
- **Super Admin** — the sole proprietor; ultimate authority over approvals, permissions, and platform configuration. **Implemented**: gates `/admin/brokers`.
- **Verified Agent** (`profiles.role = 'verified_broker'` in code) — invited, manually approved; lists and manages properties, receives assigned leads. **Implemented**: account creation + approval gate. **Planned**: listing/lead functionality itself.
- **Builder Partner** — invited, manually approved; supplies inventory under their own identity. **Planned** — no distinct Builder Partner account type exists yet; only `verified_broker`/`sales_partner`/`viewer`/`super_admin` are real roles in the `profiles.role` check constraint.
- **Viewer** — public-facing, unauthenticated; browses and enquires, no account required. Unchanged, always true.

### Access Policy (**Implemented**, 2026-08-17 — see §3 "Authentication")
- **Public signup: NO.** No signup UI or endpoint exists anywhere in the app; the only account-creation path is the invite token.
- **Invite only** — a `verified_broker`/`sales_partner` `profiles` row only ever comes from `invites` table acceptance.
- **Manual approval only** — accepting an invite creates an account in `status: pending_approval`; `/broker/dashboard` is unreachable until Super Admin flips it to `active` via `/admin/brokers`.
- **Quality-first onboarding** — enforced today only as an approve/reject gate, not yet the fuller KYC/interview workflow described below.

### Property Ownership (Planned)
Every property record must permanently store:
- Listing ID
- Uploaded By (Agent or Builder identity)
- Builder (if applicable)
- Created Date
- Verification Status

**Ownership cannot silently transfer.** Any change of uploader/owner on a listing must be an explicit, logged action, never an implicit side effect of another operation.

### Lead Ownership (Planned)
Every enquiry must create a record with:
- Lead ID
- Property ID
- Buyer
- Assigned Agent
- Status
- Timeline

Today (Implemented state), all leads from all 4 form implementations flow to one owner email/Sheet with no per-agent assignment — the current system has no concept of lead ownership at all.

### Site Visit Logs (Planned)
Site visits must be recorded as **immutable history** — append-only records of who visited, when, and with which agent — never editable after the fact.

### Deal Closure (Planned)
A defined set of required documents must be captured and verified before any commission is released. Exact document requirements are a business decision not yet specified — mark as UNKNOWN until defined by the owner.

### Commission Ledger (Planned)
A transparent, per-deal commission-split system. The guiding principle:

> Pinnacl earns platform commission because the transaction originated through the ecosystem.

Split percentages are intentionally **not specified in this file** — they remain a configurable business parameter, not a hardcoded architecture constant. Do not implement or document a fixed percentage without explicit owner approval.

---

## 7. Database Roadmap

**Phase 1 — Current (Implemented):** `data/properties.json`, a static file with 3 placeholder listings. No schema, no migrations, no concurrent-write safety. This is the actual state of "the database" today — not a database in any real sense.

**Phase 2 (Planned):**
- Migrate to Supabase (or an equivalent Postgres-backed platform).
- Real authentication, backing §6's Roles/Access Policy.
- File/image storage for property photos and future agent/builder uploads.

**Phase 3 (Planned):**
- Admin CMS for non-technical property management.
- Agent dashboard (assigned leads, own listings, site-visit logging).
- Builder dashboard (inventory submission, verification-status tracking).

**Scale phase (Planned):**
- Geographic expansion beyond the current Ambernath-stage market toward broader Maharashtra (DEC-003's documented growth path — Ambernath → MMR → Maharashtra).
- Geo-coordinate storage + nearby-property search. The current schema stores only `{city, area}` strings — no coordinates exist anywhere in the data model today.
- Full Commission Ledger implementation (§6).

---

# Curated Broker Network (Long-Term Business Architecture)

**Status: Planned. Nothing in this section exists in code today.** This section documents the long-term business architecture the founder has approved for Pinnacl's evolution beyond its current single-advisor lead-generation website — into a curated network of verified brokers collaborating under one brand. It complements §6 (Business Architecture — Community Brokerage System) with broker-specific detail; every item below is a specification for future work, not a description of anything running.

### 1. Business Model (Planned)

Pinnacl Properties is a sole proprietorship owned by the founder. Goal:
- Build a premium luxury real estate brand.
- Allow verified brokers to work through the platform.
- Community members (brokers) earn commissions.
- Pinnacl earns platform revenue from successful transactions.
- Quality is prioritized over quantity at every stage.

**This is explicitly NOT an open marketplace.** Growth is gated by curation and verification, not open participation.

### 2. Invite-Only Broker System (**Implemented** as of 2026-08-17 — a simplified variant, see §3 "Authentication")

Brokers are never allowed to self-register. **Every account is created manually by the admin.** Workflow as documented (original spec):

Admin → reviews candidate → KYC verification → interview / quality review → approves broker → creates login ID → sends temporary password → broker changes password on first login.

**What was actually built** (simpler than the above, functionally equivalent on the two hard requirements — no self-registration, admin-gated access): Admin creates an invite (email + role) → broker visits a token link and **sets their own password** (rather than admin creating one and sending it) → account exists in `pending_approval` → **admin approves/rejects via `/admin/brokers`** (this is the "approves broker" step, now happening *after* account creation rather than before, so the on-platform gate is real and enforced — a broker literally cannot reach `/broker/dashboard` while unapproved). KYC verification and interview/quality review remain manual, off-platform processes — `profiles.kyc_status` exists in the schema but nothing in the UI captures or enforces it yet. No invite email is sent automatically; the admin currently copies and shares the invite link manually.

### 3. User Roles (Planned describes target end-state; **Implemented** subset noted per role below)

| Role | Can | Cannot |
|---|---|---|
| Super Admin | **Implemented:** approve/reject broker applications; create invites; sign in via `/broker/login`, redirected to `/admin/brokers`. **Planned:** view the complete commission ledger; configure commission split ratios; edit any property's approval status; access the full audit trail | — (there is exactly one Super Admin: the founder) |
| Verified Broker | **Implemented:** create an account via invite; sign in; see a "pending approval" or "active" dashboard state. **Planned:** upload properties; manage listings; receive attributed leads; view own earnings and deal history | Cannot self-register; cannot view other brokers' earnings or ledger entries (RLS-enforced once those tables are wired to a UI); cannot approve their own uploads; cannot transfer property ownership |
| Sales Partner | **Implemented at the account/role level** — `invites.role`/`profiles.role` accept `sales_partner` identically to `verified_broker`; the two are not yet functionally differentiated anywhere. **Planned:** the actual permission distinction UNKNOWN — not yet specified by the founder | Exact scope TBD beyond account creation — do not assume any capability for this role until it is explicitly defined |
| Viewer | Browse public listings; submit enquiries | No account, no dashboard access, no visibility into broker/commission data |

### 4. Property Ownership Logic (Planned)

Every property must permanently store: Property ID, Uploading Broker, Builder/Developer, RERA Number, Project Status, Upload Date, Approval Status.

**Important rule:** the uploading broker always remains the **Source Broker.** This ownership never changes, even if another broker later sells the property. (Extends §6's "Property Ownership" principle with broker-specific fields — RERA Number, Project Status.)

### 5. Deal Attribution Workflow (Planned)

Example flow: a Builder uploads a project through Broker A. A customer comes through Broker B. The system creates: **Source Broker = Broker A**, **Closing Broker = Broker B**. Admin verifies the deal. Commission automatically splits according to the configured ratio — the ratio itself remains a configurable parameter, consistent with §6's principle that split percentages are never hardcoded in this file.

**No manual ownership transfer.** The system records both contributors (Source Broker and Closing Broker) transparently — a two-party attribution model, more detailed than §6's single "Uploaded By" field.

### 6. Commission Ledger (Planned)

Every deal creates an **immutable** ledger entry. Fields: Deal ID, Property ID, Buyer, Source Broker, Closing Broker, Gross Commission, Platform Share, Broker Share, Payment Status, Released Date. (These are schema field names, not fixed percentages — no split ratio is specified anywhere in this file, per §6.)

Statuses: **Pending → Verified → Released.**

Brokers can see only their own earnings. Admin can see the complete ledger.

### 7. Anti-Cheat Rules (Planned)

- Every lead receives a unique Lead ID.
- Every enquiry is timestamped.
- Site visits are logged.
- Call notes are stored.
- Closing proof is required before commission release.
- Audit trail cannot be edited.
- Deleted records are archived, not destroyed.

(Consistent with — and a broker-specific extension of — §8's "no hard delete" and "full audit trail" principles.)

### 8. Search Vision (Planned — Phase 2)

Users should be able to search by: City, Locality, Builder, Project, Budget, BHK, Ready / Under Construction.

**Future recommendation engine (Phase 2):** when viewing a property, suggest nearby branded projects within the same locality and budget range. Extends §7's Scale-phase "geo-coordinate storage + nearby-property search" item with a business-level recommendation framing.

### 9. Scalability Principles (Planned)

- Unlimited property records using PostgreSQL.
- Images stored in cloud object storage.
- CDN delivery.
- Server-side pagination.
- Lazy image loading.
- Full-text search indexing.
- Fast performance even with 100,000+ listings.

**"Unlimited" means practical cloud scalability, not unbounded browser-side loading** — pagination and indexing exist specifically to keep client-side rendering fast regardless of total inventory size. Consistent with §7's Phase 2 "Supabase (or equivalent Postgres-backed platform)" — PostgreSQL is named explicitly here as the underlying engine.

### 10. Legal & Compliance

**Current legal status (a real-world fact, not a code feature — do not label this "Planned"):** the founder operates as an individual MahaRERA-registered real estate agent. **The platform must never claim to be a builder.** This directly reinforces the existing DEC-005/DEC-011 brand rules and the live violations already flagged in §9 — any future compliance copy must stay consistent with this actual registration status.

**Future expansion (Planned):** company registration; platform compliance; GST/TDS workflow; written commission agreements; KYC; deal documentation.

### 11. Success Psychology

Why brokers choose Pinnacl — the platform should create ownership psychology through: transparent earnings, guaranteed attribution, visible deal history, faster marketing reach, premium brand reputation, fair commission rules, zero hidden deductions.

> People should feel they are building their business through Pinnacl, not merely working for Pinnacl.

---

## 8. Security Principles — Target Production Architecture

**Status: none of the following exist in code today.** This section documents the architecture principles the platform must satisfy before it can safely support §6's roles and uploads — it is a specification, not a status report.

- Invite-only accounts (no public signup path, ever).
- KYC required for Agent/Builder onboarding before approval.
- Full audit trail — every state-changing action logged with actor, timestamp, and before/after values.
- Duplicate-listing detection before a property enters live inventory.
- Permission-based access control enforced at the data layer, not only the UI layer.
- No hard delete — records are archived/soft-deleted, never destroyed, preserving the audit trail and ownership history §6 requires.
- Every edit logged, including edits made by Super Admin.

**Currently verified, real gaps in the shipped code (Implemented state, not target state — full detail in §9):** `/api/leads` has no rate-limiting or input validation; raw user input is interpolated unescaped into an outbound HTML email; `lib/.env.local` is tracked in git; the JSON-LD `dangerouslySetInnerHTML` pattern noted in §3 is low-risk only because no user-submitted content exists yet.

---

## 9. Technical Debt

_Verified by direct code inspection and grep during the 2026-08-16 audit. Fully resolved items from prior sessions have been removed rather than kept as strikethrough clutter — see §10 for the historical record of what was fixed and when._

**Critical:**
- **DEC-005 violation, live on `/about`:** displays "50+ Projects Curated," "6 Markets Served" against an actual inventory of 3 placeholder listings in one city. Directly contradicts a "must never be violated" brand rule.
- **DEC-011-adjacent blanket claim in `Footer.tsx`:** "RERA Registered · Verified Projects Only" as a site-wide statement in every page's footer — the same category of claim a site-wide RERA badge was previously removed from the Hero for.
- **`/properties` filter panel is functionally unstyled:** `PropertiesList.tsx` uses `card-surface`, `btn-primary-hero`, `btn-outline` — none of these classes exist in `globals.css` (confirmed by grep). The site's primary browse surface currently renders without its intended styling.
- **`/api/leads` has no rate-limiting, input validation, or sanitization** — an open, unrate-limited public write endpoint with an HTML-injection path into the owner's outbound notification email.
- **Nothing has been committed to git since `cbc6446f`.** The redesigned Navbar, the full motion system, Lenis, and this file itself all exist only as local uncommitted changes.

**Medium:**
- `--color-brand-soft`, referenced twice in `PropertyDetails.tsx`, does not exist anywhere in `globals.css` — badge and card backgrounds render broken.
- `PropertyDetails.tsx` uses a literal gradient (`bg-gradient-to-br`) — violates the no-gradient rule — and a raw `bg-green-50 text-green-800` success state, entirely off the brand palette.
- No Navbar/Footer on `/properties` and `/properties/[slug]`.
- `PropertyCardLux.tsx` uses `shadow-xl`, heavy rounding, and `scale-105` hover — inconsistent with every other card in the app.
- Two structurally different, unreconciled listing UIs (`/projects` vs `/properties`) over the same underlying data.
- Four independent, non-shared lead-form implementations.
- Server-to-self HTTP fetch pattern on `/properties` and `/properties/[slug]` (fragile, adds latency, no fallback if `NEXT_PUBLIC_SITE_URL` is misconfigured).
- Two parallel CSS token systems in `globals.css` (`--color-brand-*` vs. shadcn's oklch tokens) — `shadcn init` overwrote the original `--background`/`--foreground` mapping; unreconciled.
- Currency mojibake in `data/properties.json` (`â‚¹` instead of `₹`) on all 3 listings.
- `PropertyDetails.tsx`'s "Schedule Visit" button has no `onClick` — non-functional. Its WhatsApp link uses a placeholder number (`wa.me/91XXXXXXXXXX`).

**Low:**
- `framer-motion`, `react-slick`, `slick-carousel` (+ `types/react-slick.d.ts`) — zero imports anywhere, fully dead weight.
- `embla-carousel-react` — zero imports; no honest use case at 3 listings.
- 16 orphaned components + 2 duplicate data files.
- Two redundant icon libraries (`react-icons` + `lucide-react`).
- Geist vs. Inter typography decision unresolved (DEC-008 / `TASKS.md` T-006).
- `lib/.env.local` tracked in git.
- `PropertyDetails.tsx` uses raw `font-playfair` instead of the `font-serif` token.
- `ProjectsGrid.tsx` lacks the motion reveal its sibling sections have.
- Governance docs (`PROJECT_STATUS.md`, `TASKS.md`, `DECISIONS.md`) stale since 2026-07-12.
- Root-level stray files unrelated to the project: `hello.py`, `hello3.py`, `roo-test.txt`, `tsconfig.tsbuildinfo`.

---

## 10. Decision Register

| Decision | Status | Evidence |
|---|---|---|
| Brand principle: Luxury, Trust, Simplicity | Approved | DEC-001 |
| Early-stage, no assumed scale/inventory | Approved | DEC-002 |
| Ambernath = initial execution market | Approved | DEC-003 |
| Geographic growth path (Ambernath → MMR → India) | Approved | DEC-004 |
| No unsupported premium/scale claims | Approved (standing) — **currently violated live, see §9** | DEC-005 |
| Bootstrap-first, revenue-funded growth | Approved | DEC-006 |
| Current phase = Lean MVP | Approved | DEC-007 |
| Typography = Playfair Display + Inter | Approved, **not fully implemented** (Geist in use) | DEC-008, `TASKS.md` T-006 |
| Color direction: black/white/neutrals/restrained gold | Approved | DEC-009 |
| Rent feature = NEXT, not current scope | Approved | DEC-010 |
| RERA info must be property-specific, verified | Approved (standing) — **currently violated live, see §9** | DEC-011 |
| New tech tools require demonstrated need first | Approved | DEC-012 |
| Advanced capabilities (AI, portals, payments) = NOT YET | Approved | DEC-013 |
| Major design decisions require explicit approval | Approved (standing) | DEC-014 |
| Reference brands are benchmarks, never copied | Approved | DEC-015 |
| Existing code is context, not approved design | Approved | DEC-016 |
| Roadmap is evidence-based, not feature-driven | Approved (standing) | DEC-017 |
| Hero redesigned to search-first, no headline-only design | Implemented via direct owner instruction | Session Hero redesign work; conflicts with DEC-014's options/approval process not being formally followed on this specific change |
| Logo removed entirely from Navbar | Implemented via direct owner instruction | Session Navbar work |
| Nav relabeled: Residences/Collections/Our Story/Enquire | Implemented via direct owner instruction | Session nav-rename work |
| "Locations" and "Journal" nav items explicitly declined for now | Decided | Direct owner answer during nav-rename clarification |
| "Residences" nav item stays pointed at `/` (not `/properties`) | Decided | Direct owner answer during nav-rename clarification |
| Hero video (`hero.mp4`) adopted as current background, "for now" | Implemented via direct owner instruction, explicitly temporary | Session video-hero work |
| WhatsApp/Enquire floating button styled gold, pill-shaped, appears on scroll only | Implemented via direct owner instruction, iterated multiple times | Session Enquire-button work |
| In-content WhatsApp buttons (`EnquirySection`, `/contact`) restyled from green `.btn-whatsapp` to gold `.btn-gold-outline`; reworded from "WhatsApp Us" to brand-neutral "Enquire" with the `TbMessages` icon; dead `.btn-whatsapp` CSS removed | Implemented per explicit task + owner confirmation on wording | Session button-family redesign; grep confirmed only these 2 files ever used `.btn-whatsapp` |
| Follow-up fix: submit button and WhatsApp "Enquire" link were briefly two equal-weight competing CTAs. Fixed in `EnquirySection` and `/contact`: submit button stays the bordered primary action; the WhatsApp action was demoted to a plain text link with more vertical spacing | Implemented, owner confirmed applying the same fix to `/contact` | Session hierarchy-regression fix. `PropertyDetails` was checked and found to have a *different*, pre-existing inconsistency, not caused by this redesign, deliberately left untouched |
| Batch tooling install: `motion`, `@studio-freight/lenis` (deprecated name, flagged), `embla-carousel-react`, `class-variance-authority`, `lucide-react`; `npx shadcn@latest init` + `add button dialog input textarea` — added `components/ui/`, `lib/utils.ts`, `components.json`. Owner explicitly acknowledged the resulting CSS-token conflict and chose to reconcile it later | Implemented via direct owner instruction | Session tooling-expansion request |
| Secondary WhatsApp "Enquire" CTA refined to an editorial underline treatment (thin gold hairline, no container/border/fill) across `EnquirySection`, `/contact`, `PropertyDetails` | Implemented per explicit task; owner chose from 3 presented options | Session secondary-CTA shape polish |
| Navbar glass treatment upgraded to "liquid glass," motion-driven background/blur/border, colorless top-edge highlight, `useReducedMotion()` handling | Implemented per explicit task | Session Navbar glass refinement (later superseded by further Navbar iterations below) |
| `PropertyDetails`'s top button pair redesigned: "Schedule Visit" → `.btn-gold-outline` primary; "WhatsApp Enquiry" → quiet text-link secondary, matching the site-wide pattern | Implemented per explicit task | Session PropertyDetails CTA-hierarchy fix. A separate, pre-existing solid-gold submit button lower on the page and the placeholder WhatsApp number were explicitly left untouched, out of scope |
| Navbar iterated through multiple TEST states (dark solid, fully transparent with adaptive text color, Elliman-style translucent overlay, hover-triggered white-frosted glass while scrolled) before settling on: transparent at top of hero; dark glass (`rgba(17,17,17,0.34)`, `blur(10px)`) once scrolled; transitions to white frosted glass (`rgba(248,247,243,0.94)`, `blur(22px)`) only on hover while scrolled; hover has no effect at the top of hero | Implemented via direct owner instruction across multiple iterations | Session Navbar interaction redesign |
| Desktop nav links given an editorial gold underline hover: 1px, grows from center outward, 240ms ease-out, no spring/bounce/glow | Implemented per explicit task | Session hover-refinement work |
| Floating Enquire button converted from a text+icon pill to an icon-only circular FAB (56px desktop / 52px mobile), repositioned from vertical-center to a fixed bottom-right offset (24/20/16px per breakpoint) | Implemented per explicit task, with a mid-task correction after the wrong (orphaned `FloatingAction.tsx`) file was initially edited — the real button lives inline in `Hero.tsx` | Session floating-button redesign |
| Site-wide motion system formalized as two categories — UI interactions (240–300ms ease-out) and editorial content reveals (550–650ms ease-out, opacity+translateY only) — resolving a prior apparent inconsistency between Featured Projects' 600ms reveal and an earlier undifferentiated "300ms standard." Stale references to a superseded "500ms Navbar spring" removed from documentation | Approved | Documentation-only reconciliation, no source code touched |
| `lenis` adopted as the sole global smooth-scroll engine via `components/SmoothScroll.tsx` (`lerp: 0.08`, `smoothWheel: true`, `syncTouch: false`, `autoRaf: true`, `respectReducedMotion: true`); conflicting native `scroll-behavior: smooth` removed from `globals.css`, confirmed by grep as the only such source in the project | Approved, Implemented | Direct owner instruction, including one owner-requested config revision (`lerp` 0.1→0.08, `syncTouch` true→false) |
| `FeaturedProjects.tsx` given the editorial viewport-reveal pattern (`motion`, opacity+translateY, 0.6s, 80ms stagger, `[0.22,1,0.36,1]` ease, fires once, disabled under `useReducedMotion()`); `WhyPinnacl.tsx` given the identical pattern shortly after, establishing it as the site's standard editorial reveal | Implemented per explicit production task | Session editorial-reveal rollout across two homepage sections |
| **Invite-only community brokerage vision approved as the long-term business architecture direction** (§6, §11) — roles, invite/approval access policy, permanent property/lead ownership records, immutable site-visit logs, document-gated deal closure, and a transparent, percentage-agnostic commission ledger | **Approved — architecture decision, not yet built** | Direct owner instruction, 2026-08-16 |
| **Commission ledger principle approved**: "Pinnacl earns platform commission because the transaction originated through the ecosystem." Split percentages explicitly left unspecified and configurable, not hardcoded | **Approved — architecture decision, not yet built** | Direct owner instruction, 2026-08-16 |
| **Curated Broker Network Vision**: Pinnacl will operate as an invite-only verified broker platform with immutable deal attribution, transparent commission splitting, role-based access, and admin-controlled onboarding | **Planned** | Direct owner instruction, 2026-08-16 |
| **Production invite-only broker authentication implemented**: real Supabase Auth wired in (`@supabase/supabase-js`, `@supabase/ssr`, `server-only`); `profiles` extended (added `rejected` status) rather than creating a duplicate `broker_profiles` table; new `invites` table with admin-only RLS; `/broker/login`, `/broker/accept-invite`, `/broker/dashboard` (gated placeholder), `/admin/brokers` (approve/reject + invite UI) all built and passing `npm run build`. Properties, deals, and commissions explicitly out of scope, per the task's own instruction | **Implemented** (code-level — migrations not yet applied to the live Supabase project from this environment; see the environment note at the top of this file) | Direct owner instruction, 2026-08-17. Owner supplied live Supabase URL/publishable key directly; the assistant stopped and explicitly asked before using the service-role key, which the owner then added to `.env.local` themselves |
| **Service-role key usage restricted to a single Route Handler** (`app/api/broker/accept-invite/route.ts`) — every other admin action (creating invites, approving/rejecting brokers) goes through the caller's own authenticated session and RLS, not the service role, on a least-privilege basis | Approved, Implemented | Architecture decision made during the 2026-08-17 broker-auth implementation |
| **`middleware.ts` renamed to `proxy.ts`** per Next.js 16's deprecation of the `middleware` file convention (same behavior; exported function renamed `middleware` → `proxy`) | Implemented | Discovered as a build warning during the 2026-08-17 broker-auth implementation; fixed in the same session |

_(Rows above the 2026-08-16 entries predate this file's dating convention and are not retroactively dated — do not invent dates for them.)_

---

## 11. Pinnacl 2030 Vision

This section describes the target ecosystem in engineering terms, not marketing language. It is a specification for future architecture, not a description of anything currently running.

Pinnacl's long-term structure is a closed, invite-only brokerage network operating under a single owner's platform. Builders supply verified inventory; agents operate as verified participants who list, manage, and close deals within that inventory; every property carries a permanent, non-silently-transferable ownership record; every lead carries a permanent ownership and status record; every site visit is logged as immutable history; and every closed deal settles through a transparent commission ledger whose split logic is configurable, not hardcoded.

The network does not scale by opening registration — it scales by manual, quality-gated approval, expanding geographically from the current Ambernath-stage market outward through Thane and the rest of Maharashtra only as the underlying data, verification, and commission infrastructure (§7, §8) are actually in place to support it. Trust and verification are treated as prerequisites for growth, not features retrofitted after growth happens.

None of the systems this vision depends on — authentication, real inventory storage, role-based access, audit logging, or the commission ledger — exist in the current codebase. The present site is the entry point to this ecosystem, not yet a component of it.

---

## DO NOT BREAK

- Never introduce loud gradients, neon colors, or glow effects on any interactive element. **A live violation currently exists in `PropertyDetails.tsx` — see §9.**
- Never use playful/heavy rounded UI (bubble buttons, cartoonish shapes).
- Never let gold become a dominant or decorative color — accent only (DEC-009).
- Never add a site-wide or generic RERA badge — property-specific and verified only (DEC-011). **A live violation currently exists in `Footer.tsx` — see §9.**
- Never claim scale, client base, transactions, or inventory that isn't real (DEC-005). **A live violation currently exists on `/about` — see §9.**
- Never present the 3 items in `data/properties.json` as real, marketable inventory.
- Preserve calm, restrained, editorial spacing — no cramped stacks of competing elements anywhere.
- Keep the top navigation minimal — no more than 4 primary items, no logo unless a future decision explicitly reintroduces one.
- Never implement a major design/architecture change silently — major decisions require explicit owner approval (DEC-014).
- Never copy a named reference brand's design directly — benchmark only (DEC-015).
- Maintain the black/white/gold identity as the foundation of every surface, with warm neutrals as the only permitted extension.
- Never describe a §6/§7 (beyond Phase 1)/§8/§11 item as implemented without updating its status label here first.
- Always verify current git state before describing "what's live" — this file's snapshot goes stale the moment new commits land.
- Never invent project history, or fabricate a date for an undated decision.

---

## Permanent Memory Rules

1. Always read this file before making any recommendation about this project.
2. Always update this file when a new decision is approved or the project state materially changes.
3. Never create a second or duplicate project-memory file.
4. If this file and another document (`PROJECT_CONTEXT.md`, `DECISIONS.md`, etc.) conflict, report the conflict to the user instead of guessing which is correct.
5. Mark uncertain information as `UNKNOWN` rather than filling gaps with assumptions.
6. Never invent project history not evidenced in the repository or conversation record.
7. Every claim must be labeled **Implemented**, **Approved (not yet built)**, or **Planned/Vision** — never blur these, and never let a Planned or Approved-but-unbuilt item read as if it already exists in running code.
