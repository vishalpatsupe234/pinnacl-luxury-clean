# Project Roadmap

## Purpose
This roadmap defines the current MVP, the next development stages, and the ideas that should remain on hold until the product has validated its core luxury buyer funnel.
It is intentionally phased to keep the scope grounded and aligned with a lean, evidence-driven launch.

## Phase 1 — Lean Launch (Current)
### Objective
Launch a high-end, conversion-focused website for Pinnacl Properties that showcases curated downtown Mumbai residences, establishes trust, and enables lead capture.

### Success Criteria
- Homepage displays hero video, featured projects, brand messaging, and enquiry CTA.
- Property inventory pages render correctly from local JSON data.
- Contact and enquiry forms are functional and submit to the lead handler.
- Site builds cleanly and passes lint.
- SEO metadata and schema are present for primary pages.

### In-Scope Deliverables
- `app/page.tsx` home page with video hero and trust statements.
- `app/about/page.tsx` brand story page.
- `app/projects/page.tsx` products/projects overview page.
- `app/properties/page.tsx` property listing page with filters and results.
- `app/properties/[slug]/page.tsx` dynamic property detail pages.
- `app/contact/page.tsx` contact page with enquiry form.
- Local property data served from `data/properties.json`.
- Lead capture endpoint in `app/api/leads/route.ts`.
- Root layout and metadata in `app/layout.tsx`.

## Phase 2 — Growth & Refinement
### Objective
Refine the experience based on real traffic, lead data, and early property updates.

### Focus Areas
- Property discovery: stronger filters, search, and location-based results.
- Data quality: consistent pricing, correct currency symbols, and image fallbacks.
- Lead capture: better validation, clearer success states, and improved UX.
- SEO: page-specific metadata, better local targeting, and schema completeness.
- Analytics: add conversion tracking and lead source visibility.

### Recommended Improvements
- Add filter persistence and URL state in `PropertiesList.tsx`.
- Standardize property image handling and fallback logic.
- Replace any placeholder contact details before launch.
- Extend location pages beyond redirects if market pages are needed.
- Audit page headings, metadata, and schema for all customer-facing pages.

## Phase 3 — Scale (Later)
### Objective
Expand inventory depth and maturity while maintaining the premium brand experience.

### Potential initiatives
- Introduce a structured market insights or blog section.
- Add testimonials, case studies, and evidence-based trust signals.
- Improve CRM integration and lead management automation.
- Consider a richer property discovery experience with saved searches or saved favorites.
- Add an editorial rich content area for Mumbai luxury real estate trends.

## Roadmap Governance
- Keep scope aligned to actual business readiness: only build new content or functionality once property inventory and lead management are validated.
- Avoid complicated feature work until the luxury website has a steady stream of inquiries and validated inventory.
- Use analytics and lead quality data to prioritize the next phase.

## Current Constraints
- No external CMS or database is currently configured.
- Inventory is maintained in `data/properties.json`; this should remain the truth source until a backend is approved.
- Styling and page structure should remain premium and restrained.

## Decisions That Need Owner Input
- Exact launch markets and priority search terms.
- Whether to support additional locations beyond Mumbai in the current phase.
- The formal lead intake workflow and CRM integration strategy.
- Whether to publish testimonials or case studies in the next iteration.
