# PROJECT_STATUS — Pinnacl Properties

## Project Vision

A luxury real estate advisory platform for Mumbai, Thane, Navi Mumbai, Kalyan, Powai, Bandra, and Worli, positioned alongside brands like Sotheby's International Realty, Savills, and Compass — built lean, content-driven, and CRM-connected.

---

## Tech Stack (Current)

* Next.js (App Router)
* TypeScript
* Tailwind CSS
* Framer Motion *(rolling out)*
* Supabase (PostgreSQL) *(in progress)*
* Prisma ORM *(in progress)*
* Sanity CMS *(in progress)*
* Cloudinary *(in progress)*
* Zoho CRM *(in progress)*
* Make.com *(in progress)*
* Vercel
* GitHub

---

## Current Status

**Live, static showcase site — undergoing structured platform upgrade.**

The site is publicly live on the production domain with core marketing pages functioning. We are now layering in CMS-driven content, a real database/CRM lead pipeline, and SEO-scaled page types (builder/location/project pages).

---

## Completed

* Domain connected (pinnaclproperties.com)
* Vercel deployment + GitHub repo set up
* Hero section
* Featured properties section
* About section
* Contact / enquiry form (basic, not yet CRM-connected)
* Testimonials section
* Footer
* Black & Gold luxury design system applied across homepage

---

## In Progress

* Migrating static property data → Sanity CMS + Supabase
* Setting up Prisma schema for Lead / Property / Builder / Location models
* Designing Builder Page, Location Page, and Project Page templates
* WhatsApp CTA integration across mobile views
* Zoho CRM account + lead pipeline configuration
* Make.com automation: Form/WhatsApp lead → Supabase → Zoho CRM

---

## Current Focus

Stand up the structured content + lead pipeline layer (Sanity, Supabase, Prisma, Zoho, Make.com) so that every new page type and every captured lead flows through one consistent, trackable system.

---

## Next Major Goal

Generate and convert qualified real estate leads at scale via Builder, Location, and Project SEO pages — feeding directly into Zoho CRM for sales follow-up.

---

## Roadmap

### Phase 1 — Foundation (Current)
* Sanity CMS setup for builders, locations, projects, blog
* Supabase + Prisma data layer for leads and structured listings
* Cloudinary migration for all media
* Core CTA system: WhatsApp + Call + Enquiry Form

### Phase 2 — Lead Pipeline
* Zoho CRM integration via Make.com
* Lead source attribution (page, campaign, channel)
* Automated lead notifications (WhatsApp/Email) to sales team
* Basic lead scoring by enquiry type (buy/invest/NRI/etc.)

### Phase 3 — SEO Scale-Up
* Builder Pages (`/builders/[slug]`)
* Location Pages (`/locations/[slug]`) — Worli, Bandra, Powai, Thane, Navi Mumbai, Kalyan
* Project Pages (`/projects/[slug]`) with structured data (schema.org RealEstateListing)
* Dynamic Open Graph image generation per page
* Sitemap + Google Search Console + indexing push

### Phase 4 — Authority & Content
* Editorial blog (market insights, investment guides, neighborhood guides)
* Press/media mentions section
* Expanded testimonials with video
* Statistics/track-record section (deals closed, AUM, years of trust)

### Phase 5 — Conversion Optimization
* A/B testing on hero messaging and CTAs
* Heatmap/analytics-driven UX refinement
* Personalized property recommendations (based on enquiry history)

---

## SEO Strategy Snapshot

* **Page hierarchy:** Builder Pages → Location Pages → Project Pages → Blog
* **Schema markup:** Organization, LocalBusiness, RealEstateListing, BreadcrumbList
* **Local SEO:** Google Business Profile, NAP consistency, location-specific landing pages
* **Technical SEO:** sitemap.xml, robots.txt, Core Web Vitals targets, mobile-first indexing readiness

---

## Performance Goals

* LCP under 2.5s on mobile
* Lighthouse Performance score 90+
* Lighthouse SEO score 95+
* Zero layout shift on hero/above-the-fold content
* Image delivery fully via Cloudinary with responsive `srcset`

---

## Lead Generation Strategy Snapshot

* Primary channel: WhatsApp CTA (persistent, mobile-first)
* Secondary channel: Call CTA
* Tertiary channel: Enquiry form (longer-intent leads, NRI/investment enquiries)
* Every lead tagged with source page + campaign before entering Zoho CRM
* Make.com handles routing/notifications without custom backend code

---

## Analytics & Tracking (Planned)

* Google Analytics 4
* Google Search Console
* Conversion tracking per CTA type (WhatsApp / Call / Form)
