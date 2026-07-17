# PROJECT_STATUS.md — Pinnacl Properties

_Last updated: 2026-07-12. This document records the current factual implementation state of the
repository. It does not restate business/brand context (see PROJECT_CONTEXT.md) or approved
decisions (see DECISIONS.md). Status only — not a design or business approval record._

---

## 1. Build Status

- `npm run build` currently **passes** (Next.js 16.1.4, Turbopack). TypeScript compiles cleanly.
  Verified routes include: `/`, `/about`, `/contact`, `/properties`, `/properties/[slug]`,
  `/projects`, `/locations/[location]`, `/api/enquiry`, `/api/leads`, `/api/properties`,
  `/robots.txt`, `/sitemap.xml`. The `/projects` route currently compiles.
- Stack matches PROJECT_CONTEXT.md §8: Next.js App Router, TypeScript, Tailwind CSS v4, React 19,
  Framer Motion. No premature tooling present (no Supabase/Prisma/Sanity/Zoho/Cloudinary).

## 2. Verified Repository Implementation

_Confirmed present and compiling as of this review. Listing here does not imply approval,
production-readiness, or that any item has been individually verified as unchanged from its
original committed baseline._

- Root layout (`app/layout.tsx`): metadata, canonical, robots, Open Graph, Twitter card,
  Organization + WebSite JSON-LD schema.
- `/properties` listing page: renders `PropertiesClient`, fetches `/api/properties` with
  `cache: "no-store"`, has its own metadata and canonical URL.
- `/properties/[slug]`, `/projects`, `/locations/[location]`, API routes (`enquiry`, `leads`,
  `properties`).
- Tailwind design-token system in `globals.css`: brand color tokens (bg, surface, border, black,
  muted, gold, gold-soft), reusable component classes (buttons, inputs), reduced-motion handling.
- `data/properties.json`: three structured inventory entries (see §4 — placeholder status).

## 3. Uncommitted Working-Tree Changes (Not Yet Committed, Not Approved)

- `components/Hero.tsx` — Updated with refined grid structure per H001 (Hero Structure task); replaced video with modular HeroMedia component using premium image per H002 (Hero Background Media task)
- `components/HeroMedia.tsx` — New modular component created for H002 to support image/video flexibility
- `components/Navbar.tsx`
- `next-env.d.ts`
- Untracked: `current-changes.txt`

These are in-progress and must not be treated as final until committed and reviewed.

## 4. Implemented but Unapproved Design / Content

- Hero copy and CTA structure — present in the current uncommitted `Hero.tsx`. Per DEC-014, no
  major design/content decision here has gone through the options → trade-offs → approval
  workflow.
- Hero trust badges ("RERA Verified," "Private Site Visits," "Tailored Advisory") — currently
  implemented in the uncommitted Hero code only. This design/content is not approved, and the
  claims they display are not evidence-verified. **"RERA Verified" is especially problematic:**
  DEC-011 requires RERA information to be accurate, verified, and property/project-specific — a
  general site-wide badge does not meet that requirement and should not be treated as compliant
  or retained as-is without review.
- Navbar structure, logo usage, and nav item set — implemented in the uncommitted Navbar code,
  same approval gap as above.
- Homepage and `/properties` metadata/copy positioning the brand as **Mumbai-based**
  ("Luxury Homes in Mumbai," Organization schema `addressLocality: "Mumbai"`) — contradicts the
  approved initial execution market (DEC-003: Ambernath and nearby markets). This applies to
  `app/layout.tsx`, `app/page.tsx`, and `/properties` metadata alike.

## 5. Placeholder / Demo Data

- All three entries in `data/properties.json` — **Pinnacl Crest (Powai)**, **Pinnacl Aurelia
  (BKC Annexe)**, **Pinnacl Bayview (Worli)** — are confirmed **placeholder/demo data**, not real,
  currently marketable listings, verified mandates, or approved inventory. Must be replaced before
  production launch. Must not be referenced or displayed as real Pinnacl inventory in any context.

## 6. Known Technical Issues and Contradictions

- **Typography contradiction (DEC-008):** `globals.css` wires `--font-sans` to Geist Sans, not
  Inter. Playfair Display is correctly in place for serif/headings; the sans pairing does not
  match the approved system.
- **Currency encoding bug:** `priceDisplay` values in `data/properties.json` contain mojibake
  (`â‚¹` instead of `₹`), indicating an encoding mismatch on file save/read.
- **Duplicate/stale documentation inside `components/`:** `components/PROJECT_STATUS.md` (empty,
  0 bytes), `components/BUGS.md` (stale — claims "Active Bugs: None," which omits known current
  issues listed in this document), and `components/DECISIONS.md` (informal, unstructured,
  superseded subset of root DECISIONS.md; predates DEC-003/004 geographic decisions). Two facts
  from `components/DECISIONS.md` are not yet recorded elsewhere and should be migrated: deployment
  target (GitHub + Vercel) and domain (`pinnaclproperties.com`).
- **Component duplication / dead-code candidates** (present in `components/` per current
  directory listing, not all wired into `page.tsx`): `FeaturedA.tsx`, `FeaturedB.tsx`,
  `FeaturedC.tsx`, `FeaturedProperties.tsx` (only `FeaturedProjects.tsx` is currently used);
  `WhyPinnaclProperties.tsx` (only `WhyPinnacl.tsx` is currently used); `EnquiryForm.tsx` (only
  `EnquirySection.tsx` is currently used); `PropertyCardA.tsx`, `PropertyCardB.tsx` (relationship
  to `PropertyCardLux.tsx` unverified); `ProjectsGrid.tsx` (usage unverified). These require
  later verification of purpose (experiment, superseded, or future-intended) before any cleanup.
- **OG/Twitter image** in both `layout.tsx` and `page.tsx` points to an external Unsplash stock
  URL, not an owned Pinnacl asset.
- **Metadata duplication:** `layout.tsx` and `page.tsx` independently define overlapping OG/Twitter
  metadata with slightly different description copy — not broken, but a maintenance risk.

## 7. Open Questions Requiring Future Decision

- Should Hero/Navbar copy, CTAs, trust badges, and logo usage be formally reviewed and approved
  per DEC-014 before further iteration, or held as-is pending a dedicated design review?
- Is the Geist/Inter typography discrepancy an unapproved substitution to correct, or a proposed
  change to DEC-008 that should be formally evaluated and, if accepted, recorded as a decision
  update?
- What replaces the placeholder Mumbai inventory — real Ambernath-market listings, or a
  business decision to source initial Mumbai-market inventory (which would itself require a
  DEC-003/004 revisit, not a silent data swap)?
- Should the "RERA Verified" badge in Hero be removed or replaced with property-specific RERA
  information per DEC-011, once real inventory exists?
- Disposition of duplicate/unused component files (§6) — archive, delete, or confirm as
  in-progress alternates?
- Disposition of the three documentation files under `components/` (§6) — migrate-then-archive
  is the recommendation, pending your confirmation.

---

_Sources of truth for business/brand context and approved decisions remain PROJECT_CONTEXT.md and
root DECISIONS.md, per the project's source-of-truth priority order._