# Bugs and Improvements

## Purpose
This document tracks known issues, UX improvements, and technical debt in the current project.
It is intended to guide the next development cycle with concrete fixes and priority work.

## Known Issues
### 1. Placeholder Contact Information
- Location: `components/PropertyDetails.tsx`
- Issue: The WhatsApp/phone link uses a placeholder number `91XXXXXXXXXX`.
- Impact: Leads may fail to connect and trust is reduced.
- Fix: Replace with the official contact number once provided by the owner.

### 2. Currency Encoding Artifacts
- Location: `FeaturedProjects.tsx`, `ProjectsGrid.tsx`, and other property card renderers.
- Issue: `priceDisplay` contains `â‚¹` instead of the Indian Rupee symbol `₹`.
- Impact: Copy looks broken and reduces perceived quality.
- Fix: Normalize `priceDisplay` values in dataset or apply a formatting utility.

### 3. Filter State Persistence
- Location: `components/PropertiesList.tsx`
- Issue: Filters may not persist or restore cleanly on refresh or shareable links.
- Impact: Users may lose search context and filtering behavior feels incomplete.
- Fix: Sync filter state with URL query parameters and restore state on mount.

### 4. Image Fallback Handling
- Location: `components/FeaturedProjects.tsx`, `components/ProjectsGrid.tsx`, `components/PropertyCardLux.tsx`
- Issue: Local image fallback logic uses a remote fallback but may still break if `img` fails.
- Impact: Broken visuals on property cards.
- Fix: Standardize fallback behavior and use `next/image` where available with explicit `alt` text.

### 5. Lead Capture Persistence
- Location: `app/api/leads/route.ts`
- Issue: The endpoint only logs form payloads and does not save or validate leads.
- Impact: No long-term lead tracking or CRM follow-up capability.
- Fix: Connect the endpoint to a CRM, database, or webhook.

### 6. Location Page UX
- Location: `app/locations/[location]/page.tsx`
- Issue: location pages are implemented as redirects to search results rather than content pages.
- Impact: Limited SEO opportunity for market-specific landing pages.
- Fix: Confirm desired behavior and build market pages only if aligned with strategy.

## Improvement Opportunities
### UX Refinement
- Consolidate filter controls into a reusable UI component.
- Improve the properties page layout for mobile and desktop.
- Add a clear “no results” message with guidance for alternate searches.

### SEO & Content
- Audit page headings for each page to ensure unique and descriptive semantics.
- Add specific market copy to location pages when actual inventory exists.
- Ensure `app/properties/[slug]/page.tsx` metadata is unique per property.

### Performance & Quality
- Audit all external image usage and prefer optimized local images when available.
- Confirm that hero video is properly compressed for web delivery.
- Remove or document unused components in `components/` to reduce maintenance.

## Suggested Priority Roadmap
1. Fix contact/lead details and phone link placeholders.
2. Correct currency formatting artifacts.
3. Harden property filtering state and UX.
4. Standardize image fallback and remote image handling.
5. Add basic lead persistence/integration plan.

## Notes for Project Owner
The owner should provide:
- Official contact number(s) and WhatsApp link format.
- Preferred lead capture destination and CRM integration plan.
- Confirmation whether market pages should be static content or redirect-only.
- Updated property inventory and pricing source for production launch.
