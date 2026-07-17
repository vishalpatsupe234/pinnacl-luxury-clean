# Project Roadmap

## Purpose
This roadmap defines the current MVP, the next development stages, and the ideas that should remain on hold until the product has validated its core luxury buyer funnel.
It is intentionally phased to keep the scope grounded and aligned with a lean, evidence-driven launch.

## Brand Tagline
Luxury. Trust. Simplicity.

## Target Audience
- High Net Worth Individuals (HNIs)
- Business owners
- CXOs
- NRIs
- Investors
- Luxury home buyers
- Premium family buyers

## Phase 1 — Lean Launch (Current)
### Objective
Launch a high-end, conversion-focused website for Pinnacl Properties that showcases curated Mumbai residences, establishes trust, and enables lead capture.

### Success Criteria
- Homepage displays hero video, featured projects, brand messaging, and enquiry CTA.
- Property inventory pages render correctly from local JSON data.
- Contact and enquiry forms are functional and submit to the lead handler.
- Site builds cleanly and passes lint.
- SEO metadata and schema are present for primary pages.
- The design reflects logo-inspired minimalism, timeless elegance, premium white space, and the Black/White/Soft Metallic Gold palette.

## Phase 1 — Implementation Task List

### 1. Setup and Baseline Validation
Acceptance criteria:
- The repository is ready for development and a stable local build is available.
- Core documents, routes, assets, and dependencies are verified before feature work begins.

1. Install dependencies and confirm the development environment starts with `npm run dev`.
2. Review the existing project folder structure and key route layout.
3. Confirm `package.json` scripts include `dev`, `build`, and `lint`.
4. Validate that `next.config.js` contains the approved security headers and image settings.
5. Verify `app/layout.tsx` imports brand fonts, defines site metadata, and exposes canonical base URL.
6. Confirm `app/globals.css` includes brand colors, typography, utility classes, and responsive layout helpers.
7. Verify `data/properties.json` contains the current property inventory and valid item structure.
8. Confirm that `public/video/hero.mp4` and logo assets exist.
9. Confirm the app builds successfully with `npm run build`.
10. Confirm lint passes with `npm run lint`.
11. Document any missing or outdated dependencies and align them with the production-ready baseline.
12. Confirm the homepage route and key page routes exist.
13. Ensure no unrelated files were changed during setup validation.

### 2. Core Page and Component Implementation
Acceptance criteria:
- All core pages are implemented with shared layout, consistent branding, and content structure.
- Shared components are reusable and support responsive, luxury presentation.

14. Implement `Navbar` and `Footer` in the root layout so they are available on every page.
15. Implement `Hero`, `FeaturedProjects`, `WhyPinnacl`, and `EnquirySection` on the homepage.
16. Implement responsive hero video support with text overlay, call to action buttons, and reduced-motion support.
17. Implement homepage featured cards with image fallbacks, destination links, and minimal hover states.
18. Implement `About` page content, brand story, and visual hierarchy.
19. Implement `Projects` page with a curated grid and property preview cards.
20. Implement the `Properties` page with server-side data retrieval and initial filter UI.
21. Implement property cards with brand styling, accessible alt text, and fallback placeholders.
22. Implement the `Contact` page with enquiry form and WhatsApp link.
23. Implement `app/properties/[slug]/page.tsx` with detailed property layout, metadata, and schema.
24. Implement `app/locations/[location]/page.tsx` redirect logic with encoded query parameters.
25. Implement content copy for all core pages consistent with the luxury brand tone.

### Homepage Task Breakdown

H001 – Hero Structure
- Objective: Build the homepage hero section layout with the headline, subheadline, and content grid.
- Files to modify: `app/page.tsx`, `components/Hero.tsx`
- Dependencies: Root layout and page shell must be in place; hero content copy approved.
- Acceptance Criteria: Hero renders with a strong brand headline, supporting text, and clear section structure.
- Estimated Complexity: Medium

H002 – Hero Background Media
- Objective: Add the hero background media layer using the local video asset and fallback behavior.
- Files to modify: `components/Hero.tsx`, `public/video/hero.mp4`
- Dependencies: `Hero` component structure and asset path must be confirmed.
- Acceptance Criteria: Video loads, is muted, autoplayed, looped, and degrades gracefully if unavailable.
- Estimated Complexity: Medium

H003 – Hero Typography
- Objective: Apply luxury typography styles and responsive typographic scale to the hero copy.
- Files to modify: `components/Hero.tsx`, `app/globals.css`
- Dependencies: Brand typography tokens and global CSS utilities must exist.
- Acceptance Criteria: Headings and body text render in the approved serif/sans scale and adjust at breakpoints.
- Estimated Complexity: Low

H004 – Hero CTA
- Objective: Add and style primary and secondary call-to-action buttons in the hero section.
- Files to modify: `components/Hero.tsx`, `app/globals.css`
- Dependencies: Page routing targets and button utility classes must be available.
- Acceptance Criteria: CTA buttons are visible, accessible, branded, and navigate to the correct anchors or routes.
- Estimated Complexity: Low

H005 – Hero Mobile Responsive
- Objective: Ensure hero layout adapts cleanly on mobile, tablet, and desktop viewports.
- Files to modify: `components/Hero.tsx`, `app/globals.css`
- Dependencies: Responsive utility classes and grid layout support in global CSS.
- Acceptance Criteria: Hero content reflows sensibly on small screens with no overflow or broken spacing.
- Estimated Complexity: Medium

H006 – Hero Animation
- Objective: Add subtle entrance or hover motion to hero elements while supporting reduced motion.
- Files to modify: `components/Hero.tsx`, `app/globals.css`
- Dependencies: Motion rules in global CSS and accessibility reduced-motion settings.
- Acceptance Criteria: Animations are minimal, non-distracting, and disabled when reduced motion is requested.
- Estimated Complexity: Medium

N001 – Navbar Layout
- Objective: Build the homepage navbar layout with brand logo and desktop navigation links.
- Files to modify: `components/Navbar.tsx`, `app/globals.css`
- Dependencies: Root layout integration and global nav typography styles.
- Acceptance Criteria: Navbar displays logo and menu items correctly on desktop.
- Estimated Complexity: Low

N002 – Navbar Scroll Behaviour
- Objective: Implement the transparent-to-solid navbar transition on scroll.
- Files to modify: `components/Navbar.tsx`
- Dependencies: Client-side scroll state logic and CSS class toggles.
- Acceptance Criteria: Navbar background changes as the page scrolls down, with smooth transition.
- Estimated Complexity: Medium

N003 – Mobile Navigation
- Objective: Build the mobile menu open/close experience with accessible controls.
- Files to modify: `components/Navbar.tsx`, `app/globals.css`
- Dependencies: Navbar layout and mobile utility classes.
- Acceptance Criteria: Mobile menu opens and closes reliably and includes accessible labels.
- Estimated Complexity: Medium

F001 – Featured Projects Layout
- Objective: Create the homepage featured projects section and grid layout.
- Files to modify: `components/FeaturedProjects.tsx`, `app/page.tsx`, `app/globals.css`
- Dependencies: Homepage layout and project card component structure.
- Acceptance Criteria: Featured section renders a visually balanced grid of property cards.
- Estimated Complexity: Medium

F002 – Featured Project Cards
- Objective: Implement individual card content, image fallbacks, and CTA links.
- Files to modify: `components/FeaturedProjects.tsx`, `components/PropertyCardLux.tsx` (if used)
- Dependencies: Property data model and image asset paths.
- Acceptance Criteria: Each card shows an image, title, location, and a clickable detail/action link.
- Estimated Complexity: Medium

W001 – Why Pinnacl Section
- Objective: Build the homepage value proposition section with four brand pillars.
- Files to modify: `components/WhyPinnacl.tsx`, `app/page.tsx`, `app/globals.css`
- Dependencies: Brand messaging and grid layout utilities.
- Acceptance Criteria: Section displays four benefits clearly with consistent spacing and typography.
- Estimated Complexity: Low

C001 – CTA Section
- Objective: Build the homepage enquiry call-to-action section with form or CTA buttons.
- Files to modify: `components/EnquirySection.tsx`, `app/page.tsx`, `app/globals.css`
- Dependencies: Form field styles and contact route or external link definitions.
- Acceptance Criteria: CTA section renders a compelling enquiry prompt and accessible action controls.
- Estimated Complexity: Medium

FO001 – Footer Layout
- Objective: Build the homepage footer layout with contact details and navigation.
- Files to modify: `components/Footer.tsx`, `app/layout.tsx`, `app/globals.css`
- Dependencies: Footer typography and global spacing utilities.
- Acceptance Criteria: Footer displays consistent branding, navigation, and contact links across viewports.
- Estimated Complexity: Low

### 3. API, Data, and Lead Capture
Acceptance criteria:
- The website can serve property data and accept enquiries securely with clear success/error states.

26. Implement `app/api/properties/route.ts` to serve JSON property data and support filtering.
27. Implement query support in the property API for `slug`, `search`, `type`, `loc`, `min`, `max`, `budget`, and `status`.
28. Implement in-memory caching or request caching for the property API.
29. Implement `app/api/leads/route.ts` to accept POST enquiries and return structured success/error responses.
30. Add validation rules for lead form submissions and clear client-side error messaging.
31. Ensure `data/properties.json` referenced image paths are correct and stable.
32. Confirm property pricing, location, and metadata are formatted consistently.

### 4. Brand Styling, Accessibility, and SEO
Acceptance criteria:
- The site visually reflects the luxury brand, meets accessibility basics, and includes page-level metadata.

33. Apply the Black / White / Soft Metallic Gold palette consistently across all pages.
34. Confirm typography follows serif headings and sans body copy with premium spacing.
35. Verify animations are minimal, not distracting, and support reduced motion.
36. Confirm iconography is thin, minimal, and brand-aligned.
37. Confirm all key images have meaningful alt text.
38. Add Open Graph and Twitter metadata to homepage, property pages, and important landing pages.
39. Confirm canonical URLs use `NEXT_PUBLIC_SITE_URL` where required.
40. Add organization schema in `app/layout.tsx` and listing/schema markup on property pages.
41. Validate heading order and internal link structure for crawlability.
42. Confirm robots, sitemap, and deployment route readiness if generated by the build.

### 5. QA, Testing, and Launch Readiness
Acceptance criteria:
- The site is stable, build-verified, linted, accessible, and ready for final review.

43. Execute a build-and-lint pass after major implementation work.
44. Run manual accessibility checks for focus states, form labels, and keyboard navigation.
45. Validate responsive breakpoints for mobile, tablet, and desktop.
46. Confirm the enquiry form submits correctly, shows success state, and recovers gracefully from errors.
47. Validate the property listing and detail pages function with real data and fallback states.
48. Confirm all page metadata and schema render correctly in production HTML.
49. Confirm a customer-friendly 404 / not-found experience and error route handling.
50. Review deployment configuration and environment variable readiness for production.
51. Conduct a content and copy review for brand consistency.
52. Confirm the site performance is acceptable for luxury landing pages.
53. Prepare launch notes and make a final production readiness checklist.

### 6. Governance, Dependencies, and Parallel Work
- Start with setup validation before parallelizing feature work.
- Build shared layout, navbar, footer, and global styles first, then split page-level work.
- Implement homepage, About, Projects, and Contact in parallel only after the shared frame is stable.
- Implement property listing, detail page, and API work together as an integrated pair; the API should be available before full property page testing.
- Reserve the final QA stage for end-to-end validation and merge reconciliation.
- Keep a short review cycle between feature branches to avoid conflicts on shared components.

### Git Checkpoints
1. Baseline commit: repository validation, scripts, and dependency audit.
2. Layout commit: root layout, global styles, navbar, footer, and homepage skeleton.
3. Pages commit: About, Projects, Properties listing, Contact, and property detail scaffolding.
4. API commit: property API, lead endpoint, data validation, and routing.
5. QA/Landing commit: SEO metadata, accessibility fixes, launch checklist, and final build/lint verification.

### Notes on AI Collaboration
- AI tool A can handle content, copy, and page copywriting for homepage, About, and Projects.
- AI tool B can handle component layout, responsive styling, and shared layout implementation.
- AI tool C can handle API endpoint logic, data filtering, and lead capture validation.
- Coordinate through the `Navbar`/`Footer`/`layout` integration checkpoint before merging separate page work.
- Clearly separate content/copy tasks from component implementation tasks to reduce overlap.
- Use the QA group as a final integration stage for conflict resolution and acceptance testing.

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
