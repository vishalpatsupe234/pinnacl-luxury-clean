# Accessibility Checklist

## Purpose
This checklist documents the accessibility requirements for the Pinnacl Properties website.
It helps ensure the site is usable by people with disabilities and maintains an inclusive luxury experience.

## Semantic Structure
- [ ] Use semantic HTML elements for page structure (`header`, `main`, `section`, `nav`, `footer`).
- [ ] Each page should have one clear `<main>` region.
- [ ] Headings should follow a logical hierarchy (`<h1>`, `<h2>`, `<h3>`).

## Keyboard Accessibility
- [ ] All interactive elements are focusable via keyboard.
- [ ] The mobile menu can be opened and closed using keyboard controls.
- [ ] Form fields and buttons use visible focus states.
- [ ] Skip navigation is supported via clear page structure.

## Form Accessibility
- [ ] Form fields use accessible labels or `aria-label` attributes.
- [ ] Buttons and inputs have descriptive text.
- [ ] Success and error states are communicated clearly.
- [ ] The enquiry form posts to `app/api/leads/route.ts` with usable feedback.

## Media and Images
- [ ] All meaningful images have descriptive `alt` text.
- [ ] Decorative images use empty `alt=""` if appropriate.
- [ ] The hero video is muted and marked `aria-hidden="true"` to avoid accessibility issues.
- [ ] Reduced motion preferences are respected if animations are present.

## Visual Contrast
- [ ] Text and background combinations meet WCAG contrast thresholds.
- [ ] Buttons and links are clearly visible against their backgrounds.
- [ ] UI elements such as badges and form fields are distinguishable.

## Navigation and Labels
- [ ] Navigation links are descriptive (`Home`, `Projects`, `About`, `Contact`).
- [ ] The mobile menu toggle button has an `aria-label`.
- [ ] Links use meaningful text instead of generic phrases.

## Testing
- [ ] Run Lighthouse accessibility audits on key pages.
- [ ] Test keyboard-only navigation through the site.
- [ ] Test the mobile menu and form interactions.
- [ ] Validate page structure with a screen reader if possible.

## Project-Specific Checks
- [ ] Verify `Navbar.tsx` button labels and menu state are accessible.
- [ ] Verify `Hero.tsx` video is hidden from assistive technologies.
- [ ] Verify form fields in `Contact` and `EnquirySection` have accessible labels.
- [ ] Verify property cards are navigable and actionable for keyboard users.

## Owner-Required Accessibility Input
The owner should provide:
- Any required accessibility compliance standard (WCAG 2.1 AA, local regulations, etc.).
- Priority user segments or accessibility needs to emphasize.
- Preferred accessibility review tools or audit frequency.
