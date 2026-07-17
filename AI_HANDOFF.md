# AI Handoff

## Purpose
This document is the handoff briefing for any developer or AI agent joining the Pinnacl Properties project.
It captures the current implementation, the architecture, the critical assets, and the next safe areas to improve.

## Brand Tagline
Luxury. Trust. Simplicity.

## Project Summary
Pinnacl Properties is a premium luxury real estate advisory landing site built with Next.js App Router, TypeScript, and Tailwind CSS.
The site is intentionally small, performance-focused, and designed for high-end property marketing, lead capture, and local SEO.
It expresses a calm luxury experience grounded in curated Mumbai property advisory.

## Design Language
The website design is derived from the brand identity and logo through minimalism, timeless elegance, and premium white space.
It uses a Black + White + Soft Metallic Gold palette, calm luxury editorial layouts, and architectural photography cues.
Iconography should be thin, premium, and minimal with consistent stroke weight; colorful icons are not permitted.

## Current Project State
- Framework: Next.js 16.1.4 using the App Router.
- Styling: Tailwind CSS v4 configured in `app/globals.css`.
- Hero media: local video background at `public/video/hero.mp4`.
- Branding: transparent logo in `public/logo/pinnacl-logo-transparent.png`.
- Property data: local JSON inventory in `data/properties.json` served through `app/api/properties/route.ts`.
- Contact form: enquiry flow posts to `app/api/leads/route.ts` and logs lead payloads.
- Build status: `npm run build` passes; `npm run lint` passes.
- Target audience: HNIs, business owners, CXOs, NRIs, investors, luxury home buyers, and premium family buyers.

## Repository Structure (Key Files)
- `app/layout.tsx` — root layout, metadata, fonts, and schema.
- `app/page.tsx` — homepage composition with `Navbar`, `Hero`, `FeaturedProjects`, `WhyPinnacl`, `EnquirySection`, and `Footer`.
- `app/about/page.tsx` — about page.
- `app/contact/page.tsx` — contact page and enquiry form.
- `app/projects/page.tsx` — projects list page.
- `app/properties/page.tsx` — dynamic property listing page.
- `app/properties/[slug]/page.tsx` — property detail pages with metadata and JSON-LD.
- `app/locations/[location]/page.tsx` — location redirect page.
- `components/` — reusable UI sections.
- `app/api/` — app routes for properties and leads.
- `data/properties.json` — canonical property inventory.

## How to Start
1. Install dependencies: `npm install`
2. Run development server: `npm run dev`
3. Verify local site at `http://localhost:3000`
4. Validate production build: `npm run build`
5. Run static analysis: `npm run lint`

## What to Preserve
- The live hero video asset and its local path.
- The transparent brand logo and its navbar usage.
- Existing page routes and current content hierarchy.
- Performance, accessibility, and SEO-first architecture.
- The small, luxury-first design language.
- The target audience of HNIs, business owners, CXOs, NRIs, investors, luxury home buyers, and premium family buyers.

## Brand Guardrails
- Never shift the tone away from premium restraint and trust.
- Do not introduce bold or colorful icon styles.
- Keep the palette rooted in Black, White, and Soft Metallic Gold.
- Preserve minimal editorial layout and architectural photography cues.
- Avoid marketing language that reads as mass-market or overly promotional.

## Brand Decisions That Cannot Change Without Approval
- The primary tagline: "Luxury. Trust. Simplicity.".
- The homepage hero experience and video-led presentation.
- The use of the transparent logo and the black/white/gold palette.
- The premium minimal iconography approach.
- The current Mumbai luxury advisory positioning.

## Outstanding Owner Decisions
- Official contact number and WhatsApp integration details.
- Whether location pages should remain redirects or become full content pages.
- Exact market priorities for Mumbai luxury neighborhoods.
- The preferred CRM or lead persistence strategy.
- Any adjustments to property inventory scope or launch markets.

## AI Onboarding Checklist
- [ ] Read `PROJECT_CONTEXT.md`, `AI_HANDOFF.md`, `DESIGN_SYSTEM.md`, and `PROJECT_ROADMAP.md`.
- [ ] Confirm the tagline: Luxury. Trust. Simplicity.
- [ ] Verify the current asset paths for hero video and logo.
- [ ] Review the component inventory before proposing UI changes.
- [ ] Use the brand guardrails before changing copy or styling.
- [ ] Do not change core layout, hero content, or brand palette without approval.

## AI Session History Template
- Session goal:
- Pages reviewed:
- Assets confirmed:
- Key decisions made:
- Owner approvals needed:
- Notes on brand consistency:
- Next actions:

## Current Safe Improvement Areas
- Documentation and project planning.
- Copy refinement on marketing pages.
- Non-destructive UX improvements in component documentation.
- Metadata and schema validation.
- Hero component structure refinement (H001 completed).
- Hero background media implementation (H002 completed - premium still image with modular HeroMedia component for future video flexibility).

## Current Caution Areas
- Do not modify the core hero, logo, or brand assets without approval.
- Avoid adding new dependencies unless they solve a clearly defined need.
- Avoid rewrites of the page structure without a confirmed approval.
- Do not make broad design changes without brand guidance.

## Examples of Changes That Must Never Be Made Without Owner Approval
- Replacing the hero video or changing its usage pattern.
- Changing the primary color palette from Black/White/Soft Metallic Gold.
- Rewriting the homepage copy to a promotional or mass-market tone.
- Introducing colorful iconography or illustrative UI elements.
- Turning location redirect pages into broad marketplace pages without approval.

## Known Limitations
- Property inventory is static and maintained in `data/properties.json`.
- Lead capture is placeholder-level and only logs POST payloads.
- Location pages are implemented as redirects rather than full content pages.
- Some sections/components may exist in `components/` but are not currently rendered.

## Missing Owner-Supplied Details
The project owner should provide:
- Official brand photography sources and approved media.
- Final contact details and preferred lead handling workflow.
- Exact target markets and local SEO priorities.
- Inventory pipeline expectations and property availability cadence.
- Approval criteria for new feature changes vs. documentation-only work.

## Notes for Next Developer or AI
- Start by reviewing `PROJECT_CONTEXT.md`, `README.md`, and this handoff file.
- Use `app/api/properties/route.ts` as the primary data-access contract.
- Treat `data/properties.json` as the source of truth for property pages.
- Preserve the current luxury positioning and avoid mass-market treatments.
