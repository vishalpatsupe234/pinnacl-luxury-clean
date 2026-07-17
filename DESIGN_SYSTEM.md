# Design System

## Purpose
This design system documents the visual language, layout rules, component patterns, and interaction principles for Pinnacl Properties.
It is intended to guide consistent UI work and support future design-driven development.

## Brand Tagline
Luxury. Trust. Simplicity.

## Core Brand Principles
- Luxury, not loud.
- Confident, not gimmicky.
- Minimal, not cold.
- Trustworthy, not flashy.
- Elegant spacing and restrained contrast.
- Calm luxury in every interaction.

## Brand Tokens
### Color Palette
- `#F8F7F3` — Primary page background.
- `#FFFFFF` — Surface, cards, and sections.
- `#111111` — Primary heading and body text.
- `#7C7C76` — Muted text and secondary copy.
- `#C9A66A` — Brand gold accent for buttons, highlights, and dividers.
- `#B79A67` — Soft Metallic Gold for subtle accents and premium surfaces.
- `#E6E2D8` — Light border and divider tone.

### Logo-Derived Visual Identity
The site’s visual language is derived from the logo through:
- Minimalism: clean layouts with few decorative elements.
- Timeless elegance: serif headings, monochrome balance, and architectural spacing.
- Premium white space: generous breathing room around text and images.
- Black + White + Soft Metallic Gold palette: primary visual system.
- Calm luxury: restrained motion, quiet type, and refined materials.
- Editorial layout: strong content hierarchy, thoughtful copy placement, and structured sections.
- Architectural photography: use polished property imagery that feels grounded and aspirational.

### Typography
- Primary heading font: `Playfair Display` via `next/font` in `app/layout.tsx`.
- Primary body font: `Geist` (system sans fallback).
- Heading style: strong serif rhythm, generous leading, minimal letter spacing on large text.
- Body style: simple sans-serif, light weight, high readability.

### Type Scale
- Display headline: `text-6xl` to `text-7xl` on large screens.
- Section headings: `text-3xl` to `text-5xl`.
- Subheadings: `text-xl` to `text-2xl`.
- Body copy: `text-sm` to `text-base`.
- Micro copy: `text-xs` uppercase with tracking for labels and badges.

### Spacing System
- Section padding: `px-6 md:px-8 lg:px-12`.
- Section vertical rhythm: `py-24 md:py-32` for major sections.
- Card spacing: `gap-8` to `gap-12` to preserve calm layouts.
- Content width: use `max-w-6xl` as the main shell width.

## Layout Patterns
### Page Shells
- Use the `section-shell` utility in `app/globals.css` for centered content blocks.
- Preserve margin above fixed navbar by adding `pt-32 md:pt-40` to page-level sections.

### Hero Section
- Full-viewport height hero with an overlay.
- Media should feel premium and support readability.
- Text content should remain centered or left-aligned with generous padding.

### Section Headers
- Use `section-label` for small uppercase labels.
- Use `section-heading` for main titles.
- Use `section-body` for paragraph text.

### Grid Layouts
- Two-column layouts for about and contact pages.
- Responsive stacked layouts on mobile.
- Card grids for project/property previews with consistent spacing.

## Component Guidelines
### Navbar
- Fixed top navigation with a transparent initial state.
- Solid background and border when scrolled.
- Logo size: `h-9` base, `md:h-14` desktop.
- Use concise nav labels only.

### Hero
- Video backgrounds should be muted, looped, and non-intrusive.
- Overlay gradients should ensure contrast for text.
- Primary CTA and secondary CTA should be clearly distinct.

### Featured Cards
- Use subtle hover states: opacity shift, border emphasis.
- Keep text concise and aligned to brand copy tone.

### Forms
- Use minimal inputs with clear labels.
- Keep form fields full width on mobile and grouped with sufficient spacing.
- Buttons should be prominent and use consistent gold styling.

### Footer
- Simple, elegant footer with navigation and contact details.
- Avoid heavy visual elements and keep the focus on trust.

## Button System
### Primary Button
- Background: brand gold.
- Text: black.
- Use on main CTAs such as `Schedule a Private Tour`.

### Secondary Button
- Outline or translucent fill.
- White or gold border with text that matches the current theme.
- Use for secondary actions like `Explore Properties`.

### Utility Button
- WhatsApp button uses green accent with high contrast.
- Keep icons simple and supporting the primary action.

## Imagery & Media
- Prefer local hero and brand assets where possible.
- Use polished luxury photography for properties.
- Keep imagery grounded in real luxury living rather than aspirational fantasy.
- Ensure `alt` text is descriptive and supports SEO.

## Interaction Principles
- Keep motion minimal and functional.
- Use fade-in transitions sparingly.
- Avoid high-frequency animation or distracting movement.
- Maintain elegant spacing and calm, unobtrusive interactions.
- Ensure hover and focus states are perceptible but subtle.

## Content & Copy Style
- Use factual, elegant copy with a premium tone.
- Avoid exaggerated terms such as “best in class” or “mega-luxury”.
- Emphasize trust, curation, and clarity.
- Use short, meaningful phrases for CTAs and headlines.

## Accessibility Notes
- Maintain strong contrast on text and buttons.
- Ensure interactive elements are keyboard-focusable.
- Apply semantic HTML for headings, buttons, forms, and navigation.

## Usage Notes
- This system is a guide for development and should be applied consistently across all pages.
- When new components are added, reference the existing `app/globals.css` utilities and brand tokens.
- Any divergence from this system should be justified with a brand or UX decision.

## Target Audience
- High Net Worth Individuals (HNIs)
- Business owners
- CXOs
- NRIs
- Investors
- Luxury home buyers
- Premium family buyers

## Iconography Guidelines
- Use thin outline icons with consistent stroke weight.
- Prefer premium minimal icons with restrained detail.
- Avoid colorful icons; keep icon color neutral or gold.
- Maintain uniform spacing around iconography.
- Align icon style with the luxury editorial tone of the site.
