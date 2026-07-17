# AI Handoff

## Purpose
This document is the handoff briefing for any developer or AI agent joining the Pinnacl Properties project.
It captures the current implementation, the architecture, the critical assets, and the next safe areas to improve.

## Project Summary
Pinnacl Properties is a premium luxury real estate advisory landing site built with Next.js App Router, TypeScript, and Tailwind CSS.
The site is intentionally small, performance-focused, and designed for high-end property marketing, lead capture, and local SEO.

## Current Project State
- Framework: Next.js 16.1.4 using the App Router.
- Styling: Tailwind CSS v4 configured in `app/globals.css`.
- Hero media: local video background at `public/video/hero.mp4`.
- Branding: transparent logo in `public/logo/pinnacl-logo-transparent.png`.
- Property data: local JSON inventory in `data/properties.json` served through `app/api/properties/route.ts`.
- Contact form: enquiry flow posts to `app/api/leads/route.ts` and logs lead payloads.
- Build status: `npm run build` passes; `npm run lint` passes.

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

## Current Safe Improvement Areas
- Documentation and project planning.
- Copy refinement on marketing pages.
- Non-destructive UX improvements in component documentation.
- Metadata and schema validation.

## Current Caution Areas
- Do not modify the core hero, logo, or brand assets without approval.
- Avoid adding new dependencies unless they solve a clearly defined need.
- Avoid rewrites of the page structure without a confirmed approval.
- Do not make broad design changes without brand guidance.

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
