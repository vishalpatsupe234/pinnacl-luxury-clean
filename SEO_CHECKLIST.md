# SEO Checklist

## Purpose
This checklist documents the SEO requirements for Pinnacl Properties and the specific areas to validate in the current codebase.
Use it to verify that every public page is discoverable, well-structured, and optimized for luxury real estate search.

## Metadata
- [ ] Each page has a unique `title` and `description`.
- [ ] Page metadata is defined in `app/layout.tsx`, `app/page.tsx`, `app/about/page.tsx`, `app/contact/page.tsx`, `app/projects/page.tsx`, `app/properties/page.tsx`, and `app/properties/[slug]/page.tsx`.
- [ ] Canonical URLs are configured using `alternates.canonical`.
- [ ] Open Graph metadata is present on the homepage and key landing pages.
- [ ] Twitter metadata is present on the homepage and key landing pages.

## Structured Data
- [ ] Organization schema is embedded in `app/layout.tsx`.
- [ ] Website schema is embedded in `app/layout.tsx`.
- [ ] Property detail pages include valid JSON-LD listing schema.
- [ ] Structured data uses the actual `NEXT_PUBLIC_SITE_URL` value when available.

## Content Structure
- [ ] Each page uses a single main `<h1>`.
- [ ] Headings are hierarchical and descriptive.
- [ ] Image elements include meaningful `alt` text.
- [ ] Links use descriptive text rather than “click here.”
- [ ] Property pages use property-specific headings and metadata.

## Technical SEO
- [ ] `robots.txt` and `sitemap.xml` exist and include primary site pages.
- [ ] No important public page is disallowed in `robots.txt`.
- [ ] Internal links are crawlable and use the correct URL format.
- [ ] No essential content is hidden behind client-only rendering on initial load.
- [ ] Remote images use allowed domains or local assets.

## Local and Market SEO
- [ ] City and location names appear in title tags and meta descriptions where relevant.
- [ ] Property detail metadata mentions the project name and Mumbai context.
- [ ] Contact page includes local contact information and location details.
- [ ] `/locations/[location]` route behavior matches the local landing page strategy.

## Validation Steps
1. Review page metadata in each route file.
2. Validate structured data with a JSON-LD validator.
3. Check sitemap output against actual route structure.
4. Inspect `robots.txt` for any disallowed site sections.
5. Run Lighthouse SEO checks for key landing pages.

## Owner-Required SEO Inputs
The owner should provide:
- Primary market keywords and exact city/location focus.
- Final brand title and description preferences.
- Approved Open Graph images and alt text.
- Whether location pages should be content-first or redirects.
