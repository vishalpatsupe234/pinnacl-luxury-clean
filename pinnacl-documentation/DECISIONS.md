# DECISIONS

A running log of strategic, technical, and brand decisions for Pinnacl Properties. Newest decisions at the top of each section.

---

## Branding

* Black, White, and Gold color palette — locked, no deviation without a formal rebrand decision
* "Quiet luxury" visual language over loud/flashy luxury cues
* Premium minimal design — every added element must justify its presence
* Tagline: **"Luxury. Trust. Simplicity."**

---

## Business Positioning

* Pinnacl is a **luxury real estate advisory**, not a listings aggregator
* We compete on trust and curation, not inventory volume
* Comparable brand tier: Sotheby's International Realty, Knight Frank, Savills, Compass, DAMAC, Emaar — adapted to an India-focused boutique model

---

## Target Audience

* HNI and UHNI clients
* Business owners and entrepreneurs
* NRIs investing in Mumbai/Thane/Navi Mumbai real estate
* Upper-middle-class families upgrading to premium homes
* Luxury home buyers across Mumbai, Thane, Navi Mumbai, Kalyan, Powai, Bandra, and Worli

---

## Technology Decisions

* **Next.js App Router** — chosen for SEO performance (SSR/ISR), routing simplicity, and Vercel-native deployment
* **TypeScript** — type safety across growing codebase, fewer production bugs
* **Tailwind CSS** — fast, consistent styling without custom CSS sprawl
* **Framer Motion** — for premium, subtle micro-interactions (not heavy animation)
* **Supabase (PostgreSQL)** — system of record for leads and structured property data; chosen over Firebase for relational integrity and SQL portability
* **Prisma ORM** — type-safe database access layer over Supabase
* **Sanity CMS** — chosen over a headless WordPress/Contentful setup for its developer experience and flexible content modeling (builders, locations, projects)
* **Cloudinary** — image/video optimization and responsive delivery; avoids hosting heavy media in the repo or on Vercel directly
* **Zoho CRM** — sales-side lead management; chosen for cost-effectiveness and strong Indian-market support
* **Make.com** — no-code automation layer connecting website → Supabase → Zoho CRM → WhatsApp/Email notifications, avoiding custom backend glue code
* **Vercel** — hosting and CI/CD, native Next.js support
* **GitHub** — version control and PR review workflow

**Rule of thumb:** prefer managed/no-code services (Sanity, Make.com, Zoho) over custom-built admin tools or backend services unless a clear scaling need justifies the extra engineering.

---

## Deployment

* GitHub → Vercel CI/CD pipeline
* Production deploys only from `main`
* Content updates (copy, builder/project info) flow through Sanity Studio, not code deploys

---

## Domain

* pinnaclproperties.com — primary production domain
* All marketing campaigns, business cards, and CRM records use this domain exclusively

---

## SEO Strategy Decisions

* Programmatic page structure: **Builder Pages → Location Pages → Project Pages**
* Each page type carries its own schema markup (Organization, RealEstateListing, LocalBusiness, BreadcrumbList as applicable)
* Local SEO prioritized over generic national keywords — location pages are the primary organic growth lever
* Blog/content strategy deferred until core programmatic pages are live (see TASKS.md)

---

## Lead Generation Decisions

* WhatsApp CTA is the primary mobile conversion channel (higher intent than email in this market)
* Call CTA secondary, persistent on mobile
* All form/CTA leads must capture source + page context before hitting CRM
* Zoho CRM is the single source of truth for sales follow-up — no leads managed via spreadsheets

---

## Website Objective

* Generate and convert qualified, high-intent real estate leads — not raw traffic volume

---

## Website Style

* Modern luxury, minimal design
* Fast loading, mobile-first
* Editorial-grade photography and typography over UI ornamentation
