# Technical Architecture

## Purpose
This document explains how Pinnacl Properties is built and how data flows through the application.
It is meant to help developers and AI agents understand the architecture before making changes.

## Stack
- Next.js 16.1.4 with App Router and TypeScript.
- Tailwind CSS v4 for styling.
- React 19 with client components only where required.
- Local JSON-backed API layer for property inventory.

## Application Layers
### Presentation
- `app/layout.tsx` defines the root HTML structure, fonts, and site-wide schema.
- Page components in `app/` compose shared components from `components/`.
- `app/globals.css` defines theme values, spacing utilities, and reusable class patterns.

### Data
- `data/properties.json` is the single source of truth for property inventory.
- The property API reads from this JSON file and caches the result for five minutes.
- Lead submissions are captured through a simple POST endpoint and are not persisted.

### API
- `app/api/properties/route.ts`
  - Reads local inventory from `data/properties.json`.
  - Supports query parameters: `slug`, `search`, `type`, `loc`, `min`, `max`, `budget`, `status`.
  - Returns either a single property or filtered property list.
  - Uses in-memory caching to limit file reads.
- `app/api/leads/route.ts`
  - Accepts lead POST requests from the site forms.
  - Returns a success response after logging the payload.
  - Placeholder for future CRM/webhook or database integration.

## Routing and Rendering
### Static Routes
- `/` — homepage
- `/about` — about page
- `/contact` — contact page
- `/projects` — project listings
- `/properties` — properties page
- `/robots.txt`, `/sitemap.xml` — static site metadata

### Dynamic Routes
- `/properties/[slug]` — property detail pages rendered server-side using API data.
- `/locations/[location]` — redirect route sending users to `/properties?loc=<location>`.

### Rendering Strategy
- Landing pages and marketing pages are prerendered when possible.
- Property listing and detail pages use server-rendered data fetches.
- Client components are minimal and used for interactivity: hero video, mobile menu, property filtering, forms.

## Data Flow
### Property Listing Flow
1. `app/properties/page.tsx` calls `/api/properties` server-side.
2. The API reads `data/properties.json`, applies filters, and returns JSON.
3. `PropertiesClient.tsx` hydrates the initial items and renders `PropertiesList.tsx`.
4. `PropertiesList.tsx` may perform client-side fetches on filter changes.

### Property Detail Flow
1. `app/properties/[slug]/page.tsx` calls `/api/properties?slug=<slug>`.
2. The API returns the matching property object.
3. The page renders `PropertyDetails.tsx` and injects JSON-LD schema.

### Lead Capture Flow
1. Forms on `Contact` and `EnquirySection` post to `/api/leads`.
2. The endpoint logs received payloads and returns a JSON response.
3. No persistence or CRM integration exists yet.

## Asset Management
- Hero video lives in `public/video/hero.mp4` and is served as a static asset.
- Logo files are stored in `public/logo/`.
- Property images are stored in `public/properties/`.
- Remote images are allowed from `images.unsplash.com` via `next.config.js`.

## Security & Configuration
- `next.config.js` configures security headers for all routes.
- Remote image domains are restricted to the approved host.
- `NEXT_PUBLIC_SITE_URL` is used to construct canonical and Open Graph URLs.

## Deployment
- Local development: `npm run dev`
- Production build: `npm run build`
- Lint: `npm run lint`
- No database or external hosting configuration is currently embedded in the repo.

## Maintainability Notes
- Keep the current data API pattern if inventory remains small.
- Do not add a database until the business requires persistent listing updates and lead storage.
- Prefer small reusable components and avoid large page-specific monoliths.
- Add new pages and content sections only when backed by brand and inventory clarity.

## Operational Limitations
- The inventory is static and must be updated manually in `data/properties.json`.
- The lead capture endpoint is a placeholder and requires an actual CRM/integration layer.
- `app/locations/[location]/page.tsx` is currently a redirect, not a full location landing page.

## Owner-Required Architecture Decisions
The owner should provide direction on:
- whether to keep the local JSON inventory or migrate to a database next,
- the priority markets and location pages to add,
- the lead management workflow and CRM integration timeline.
