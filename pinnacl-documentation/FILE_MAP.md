# FILE_MAP

Quick reference: "I need to change X" → "edit this file."

---

## Pages (App Router)

| What you want to change | File |
|---|---|
| Home Page | `app/page.tsx` |
| Properties Listing Page | `app/properties/page.tsx` |
| Builder Profile Pages | `app/builders/[slug]/page.tsx` |
| Location Pages (e.g. /locations/worli) | `app/locations/[slug]/page.tsx` |
| Project Detail Pages | `app/projects/[slug]/page.tsx` |
| Contact Page | `app/contact/page.tsx` |
| About Page | `app/about/page.tsx` |

---

## Core Components

| What you want to change | File |
|---|---|
| Hero Section | `components/Hero.tsx` |
| Navbar | `components/Navbar.tsx` |
| Footer | `components/Footer.tsx` |
| Featured Properties Grid | `components/FeaturedProperties.tsx` |
| About / Trust Section | `components/AboutPinnacl.tsx` |
| Testimonials | `components/Testimonials.tsx` |
| Lead Enquiry Form | `components/EnquiryForm.tsx` |
| WhatsApp CTA Button | `components/WhatsAppCTA.tsx` |
| Call CTA Button | `components/CallCTA.tsx` |
| Builder Card | `components/BuilderCard.tsx` |
| Location Card | `components/LocationCard.tsx` |
| Project Card | `components/ProjectCard.tsx` |
| SEO Schema Injector | `components/SchemaMarkup.tsx` |

---

## Data & Integration Layer

| What you want to change | File / Service |
|---|---|
| Property/Builder/Location editorial content | Sanity CMS Studio |
| Lead records, structured property data | Supabase (PostgreSQL) via Prisma |
| Prisma schema/models | `prisma/schema.prisma` |
| Images and video assets | Cloudinary |
| Lead routing automation | Make.com scenarios |
| Sales CRM records | Zoho CRM |
| Legacy static property data (being phased out) | `data/properties.json` |

---

## Config & Meta

| What you want to change | File |
|---|---|
| Site-wide metadata, fonts, layout shell | `app/layout.tsx` |
| Tailwind theme (colors, typography) | `tailwind.config.ts` |
| Environment variables | `.env.local` (never commit) |
| robots.txt / sitemap | `app/robots.ts`, `app/sitemap.ts` |
