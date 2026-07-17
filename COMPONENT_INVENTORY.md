# Component Inventory

## Purpose
This inventory describes the current component and page structure of Pinnacl Properties.
It helps new developers or AI agents understand the codebase, identify active UI pieces, and locate functionality quickly.

## Pages
- `app/page.tsx` — Homepage. Uses `Navbar`, `Hero`, `FeaturedProjects`, `WhyPinnacl`, `EnquirySection`, and `Footer`.
- `app/about/page.tsx` — About page. Uses `Navbar`, page introduction, stats, and `Footer`.
- `app/contact/page.tsx` — Contact page. Uses `Navbar`, contact form, lead submission logic, and `Footer`.
- `app/projects/page.tsx` — Projects landing page. Uses `Navbar`, `ProjectsGrid`, and `Footer`.
- `app/properties/page.tsx` — Properties listing page. Fetches server-side data and renders `PropertiesClient`.
- `app/properties/[slug]/page.tsx` — Property detail page. Fetches a single property via API and renders `PropertyDetails`.
- `app/locations/[location]/page.tsx` — Location redirect page. Redirects to the properties listing filtered by location.
- `app/layout.tsx` — Root layout, global metadata, fonts, and structured data.

## Layouts
- `app/contact/layout.tsx` — Contact route layout wrapper. Currently returns children with no additional layout.

## Shared Components
- `components/Navbar.tsx` — Primary navigation and brand logo, with scroll-aware styling and mobile menu.
- `components/Hero.tsx` — Homepage hero section with full-screen video background and marketing CTAs.
- `components/FeaturedProjects.tsx` — Featured projects section on the homepage.
- `components/WhyPinnacl.tsx` — Value proposition section with four benefit cards.
- `components/EnquirySection.tsx` — Lead capture section used on the homepage.
- `components/Footer.tsx` — Site footer with navigation, contact details, and copyright.
- `components/PropertiesClient.tsx` — `Suspense` wrapper for client-side property listing.
- `components/PropertiesList.tsx` — Client-side properties filter sidebar and listing grid.
- `components/ProjectsGrid.tsx` — Grid of project cards used on the projects page.
- `components/PropertyDetails.tsx` — Single property detail layout, including image, title, location, price, and highlights.

## Utility / Support Components
- `components/PropertyCardLux.tsx` — Reusable property card used by the properties listing.
- `components/PropertyGallery.tsx` — Image gallery component (may be used for property details or media display).
- `components/LuxurySearchBar.tsx` — Search input component for luxury web interactions.
- `components/FloatingAction.tsx` — Floating action UI element for a persistent control.
- `components/FeaturedA.tsx`, `FeaturedB.tsx`, `FeaturedC.tsx` — Additional featured content sections.
- `components/Collaboration.tsx` — Partnership or collaboration marketing section.
- `components/Testimonials.tsx` — Client testimonial section.
- `components/WhyPinnaclProperties.tsx` — Alternate value proposition section for properties.

## API Routes
- `app/api/properties/route.ts` — Reads `data/properties.json` and returns property data, with support for search and filters.
- `app/api/leads/route.ts` — Accepts lead form POST requests and logs payloads.

## Data Sources
- `data/properties.json` — Local inventory data for property listings and details.
- `public/properties/` — Local property images referenced by inventory.
- `public/video/hero.mp4` — Homepage hero video source.

## Usage Notes
- Focus first on components actually rendered by the current routes.
- `PropertiesList.tsx` is the main interactive listing component and depends on `PropertiesClient.tsx`.
- `PropertyDetails.tsx` is the canonical detail view for each property page.
- Additional UI components may be kept for future page expansions but are not currently essential.

## Component Status
- Active components: used by live routes and pages.
- Support components: available for future expansion and reference.
- Unused components should be audited before changes to avoid stale code or duplication.
