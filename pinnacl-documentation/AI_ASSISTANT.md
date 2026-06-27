# AI_ASSISTANT

## Role of This File

This file defines how an AI assistant (or any new contributor) should think, decide, and act on the Pinnacl Properties codebase. Read this before touching any file.

---

## Project Name

Pinnacl Properties

## Purpose

A premium luxury real estate advisory platform built to generate and convert qualified HNI/UHNI property leads across Mumbai, Thane, Navi Mumbai, Kalyan, Powai, Bandra, Worli, and other prime micro-markets.

We are building toward the digital credibility of brands like Sotheby's International Realty, Knight Frank, Savills, DAMAC, Emaar, and Compass — but with a lean, founder-operated tech stack.

---

## Brand Identity

* **Tagline:** Luxury. Trust. Simplicity.
* **Positioning:** Premium real estate consultancy, not a listings portal
* **Audience:** HNI/UHNI buyers, business owners, NRIs, upper-middle-class upgraders
* **Tone:** Quiet luxury — confident, understated, never salesy

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Motion | Framer Motion |
| Database | Supabase (PostgreSQL) |
| ORM | Prisma |
| CMS | Sanity CMS |
| Media | Cloudinary |
| CRM | Zoho CRM |
| Automation | Make.com |
| Hosting | Vercel |
| Source Control | GitHub |

**Why this stack:** every layer is managed/serverless, scales without a dedicated backend team, and keeps the marketing site editable without redeploying code (Sanity for content, Cloudinary for media).

---

## Domain & Repository

* **Domain:** pinnaclproperties.com
* **Repository:** pinnacl-luxury-clean

---

## Architecture Overview

```
Visitor
  → Marketing Pages (Next.js, statically/ISR rendered)
  → Builder Pages / Location Pages / Project Pages (Sanity-driven)
  → Enquiry / WhatsApp / Call CTA
  → Lead captured → Supabase (system of record)
  → Make.com automation
  → Zoho CRM (sales follow-up)
```

---

## Important Files

### app/page.tsx
Homepage layout — hero, featured properties, trust signals, lead CTA.

### app/properties/page.tsx
Properties listing page.

### app/builders/[slug]/page.tsx
Builder profile pages (SEO + authority pages).

### app/locations/[slug]/page.tsx
Location landing pages (e.g. /locations/worli, /locations/powai) for local SEO.

### app/projects/[slug]/page.tsx
Individual project/property detail pages with structured data.

### app/contact/page.tsx
Contact page with enquiry form and CTAs.

### components/Hero.tsx
Hero section — primary headline, CTA, premium visual.

### components/Navbar.tsx
Top navigation.

### components/FeaturedProperties.tsx
Featured property cards (pulled from Sanity/Supabase).

### components/AboutPinnacl.tsx
About / trust-building section.

### components/Testimonials.tsx
Client testimonials.

### components/EnquiryForm.tsx
Primary lead capture form → Supabase → Make.com → Zoho CRM.

### components/WhatsAppCTA.tsx
Persistent WhatsApp contact CTA (mobile-first lead channel).

### components/Footer.tsx
Footer section with NAP (name/address/phone) for local SEO.

---

## Data Layer

### Sanity CMS
Source of truth for editorial content: builder profiles, project descriptions, location pages, blog/SEO articles.

### Supabase (PostgreSQL) + Prisma
System of record for leads, enquiries, and structured property data. Prisma schema defines `Lead`, `Property`, `Builder`, `Location` models.

### Cloudinary
All property imagery, hero videos, and optimized responsive media.

### data/properties.json
Legacy/static fallback dataset — to be migrated fully into Supabase/Sanity (see TASKS.md).

---

## Deployment Flow

```
Code Change → GitHub → Vercel Preview → Review → Merge to main → Vercel Production Deploy → Live Website
```

Content-only changes (copy, images, builder/project info) go through Sanity Studio and do **not** require a code deploy.

---

## Design Rules

* Black, White, and Gold palette only
* Quiet luxury — minimal, large whitespace, no visual clutter
* Premium, editorial-grade typography
* Mobile-first, every screen designed at 375px first
* Fast loading — target sub-2.5s LCP
* Real, high-quality photography only — no stock-photo feel

---

## Business Rules

* Every page must serve lead generation, trust-building, or SEO — no decorative-only pages
* No spammy marketing language, no countdown/urgency gimmicks
* Premium positioning only — never discount-led messaging
* Every lead must land in Zoho CRM with source attribution

---

## Before Editing Any File

1. Check `TASKS.md` for current priorities
2. Check `BUGS.md` for known issues affecting that area
3. Check `DECISIONS.md` for relevant prior decisions
4. Check `FILE_MAP.md` to confirm you're editing the right file
5. Then edit

---

## When an Error Occurs

1. Take a screenshot
2. Log it in `BUGS.md` under Active Bugs with steps to reproduce
3. Apply the fix
4. Move the entry to Fixed Bugs with the fix summary
5. If the bug reveals a process gap, log a corresponding note in `DECISIONS.md`

---

## Current Goal

Evolve Pinnacl Properties from a static showcase site into a structured, CMS-driven, CRM-connected luxury real estate platform that consistently generates and converts qualified HNI/UHNI leads.
