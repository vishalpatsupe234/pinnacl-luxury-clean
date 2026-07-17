# Performance Checklist

## Purpose
This checklist defines the performance standards for Pinnacl Properties and the specific validation steps for the current implementation.
It is intended to keep the site fast, lightweight, and strong on both mobile and desktop.

## Build and Runtime
- [ ] `npm run build` completes successfully.
- [ ] `npm run lint` completes without errors.
- [ ] The production build reports no unexpected warnings.
- [ ] No unused or unnecessary dependencies are added.

## Asset Optimization
- [ ] Hero video is served locally from `public/video/hero.mp4`.
- [ ] Hero video is optimized for web delivery and not larger than necessary.
- [ ] Property images are stored as optimized `webp` assets in `public/properties/`.
- [ ] Remote image loading is restricted to approved domains in `next.config.js`.
- [ ] All visible images either specify dimensions or use responsive `sizes`.

## UX Performance
- [ ] Largest Contentful Paint (LCP) is prioritized by hero content.
- [ ] Cumulative Layout Shift (CLS) is minimized with stable hero and card sizing.
- [ ] JavaScript bundles are limited to essential UI and interactivity behavior.
- [ ] Animations and transitions are smooth and low-cost.

## CSS and Fonts
- [ ] Tailwind CSS is used via utility classes and global theme definitions.
- [ ] Fonts are loaded using `next/font` in `app/layout.tsx`.
- [ ] No large custom font bundles are introduced without need.
- [ ] CSS is kept modular and avoids unnecessary repetition.

## Data and API Performance
- [ ] `app/api/properties/route.ts` uses in-memory caching for property inventory.
- [ ] `app/api/leads/route.ts` is lightweight and only handles POST payloads.
- [ ] Client-side fetches occur only when required (e.g. property filtering).
- [ ] Server-side initial rendering is used for marketing pages.

## Validation Steps
1. Run `npm run build` and confirm full build completion.
2. Run Lighthouse performance audits on `/` and `/properties`.
3. Inspect Hero video network payload and loading behavior.
4. Verify that images load efficiently and use optimized formats.
5. Confirm caching headers in production if deployed.

## Owner-Required Performance Inputs
The owner should provide:
- Target performance metrics (e.g. Lighthouse scores, max page size).
- Confirmation of the hero video quality vs file size trade-off.
- Any required performance budgets for future features.
