# TASKS.md — Pinnacl Properties

_Last updated: 2026-07-12. This is the working task backlog. It implements no decisions on its
own — task completion still follows the project's workflow rules (options → trade-offs →
recommendation → owner approval → implementation → verification). Source of truth priority:
PROJECT_CONTEXT.md → DECISIONS.md → PROJECT_STATUS.md → this file → repository code._

---

## How to read this backlog

- **Approval required = Yes** → a design, content, brand, or scope decision; must go through the
  options/trade-offs/approval process before implementation.
- **Approval required = No** → a technical correction or verification step with no brand/design
  judgment call.
- NOW tasks are ordered by **dependency and business/brand risk**, not by ease.

---

## NOW — Smallest set required to safely resume development and prepare toward launch

### T-001 — Review uncommitted Hero.tsx and Navbar.tsx: preserve / modify / discard
- **Why it matters:** Both files hold live, unreviewed working-tree changes. Nothing involving
  Hero or Navbar content (T-003, T-004, T-005) can be scoped correctly until it's decided whether
  this version is the working base, a partial draft, or to be discarded.
- **Scope:** Decision-only. Review current content against brand principle, DEC-009, DEC-014. No
  code changes in this task.
- **Files likely affected:** `components/Hero.tsx`, `components/Navbar.tsx` (review only).
- **Dependencies:** None.
- **Approval required:** Yes.
- **Completion criteria:** Explicit owner decision recorded: preserve as-is / preserve with listed
  changes / discard and restart, for each file.
- **Status:** TODO

### T-002 — Resolve geographic-positioning contradiction (Mumbai copy/metadata vs. Ambernath stage)
- **Why it matters:** Highest business risk item. `layout.tsx`, `page.tsx`, and `/properties`
  metadata currently claim a Mumbai-based brand, including in structured data
  (`addressLocality: "Mumbai"`), contradicting DEC-003/DEC-004/DEC-005. This affects real SEO
  signals sent to Google now, not just visible copy.
- **Scope:** Define approved wording/geography positioning for title, meta description, OG/Twitter
  copy, and Organization JSON-LD `address`, consistent with Ambernath-stage execution while
  preserving long-term brand ambition language where appropriate (PROJECT_CONTEXT.md §3–4).
- **Files likely affected:** `app/layout.tsx`, `app/page.tsx`, `app/properties/page.tsx` metadata,
  possibly `components/Hero.tsx` copy.
- **Dependencies:** T-001 (if Hero copy is part of the same wording pass).
- **Approval required:** Yes.
- **Completion criteria:** All site metadata, JSON-LD, and visible copy reflect the approved
  current-stage geography; no Mumbai-as-current-market claims remain outside long-term-ambition
  context.
- **Status:** TODO

### T-003 — Hero image vs. video: present options and obtain approval
- **Why it matters:** DEC-014 explicitly names hero treatment as a major decision requiring
  options, trade-offs, and approval before implementation — the current video hero has not been
  through this process.
- **Scope:** Prepare comparison (performance/Core Web Vitals, mobile data cost, production
  effort, brand impact) of video vs. static image hero; recommend one direction.
- **Files likely affected:** `components/Hero.tsx` (pending outcome).
- **Dependencies:** T-001.
- **Approval required:** Yes.
- **Completion criteria:** Owner has selected image or video direction with documented rationale.
- **Status:** TODO

### T-004 — Approve Hero copy, CTAs, and correct/remove unsupported trust claims
- **Why it matters:** Current copy/CTAs/badges are implemented but unapproved and currently carry
  two open issues: the geographic contradiction (T-002) and a site-wide **"RERA Verified"** badge
  that contradicts DEC-011, which requires RERA information to be accurate, verified, and
  property/project-specific — a blanket homepage claim does not meet this.
- **Scope:** Review current copy/CTA/badge set; remove or correct "RERA Verified" (remove
  entirely, or replace with a property-specific display once real, verified inventory exists);
  approve final wording for the rest.
- **Files likely affected:** `components/Hero.tsx`.
- **Dependencies:** T-001, T-002, T-003.
- **Approval required:** Yes.
- **Completion criteria:** Hero copy, CTAs, and badges are explicitly approved; no unsupported or
  site-wide RERA claim remains anywhere on the page.
- **Status:** TODO

### T-005 — Approve Navbar structure, logo usage, and route links
- **Why it matters:** Navbar is uncommitted/unapproved. Its nav-item targets need to be checked
  against routes that actually exist and against approved NOW-scope navigation needs — not against
  an assumed route that hasn't been verified.
- **Scope:** Confirm nav item set covers the approved NOW-scope pages that actually have verified
  compiled routes (currently confirmed: `/`, `/about`, `/contact`, `/properties`,
  `/properties/[slug]`, `/projects`, `/locations/[location]`); confirm the logo asset renders
  correctly; confirm no link targets a non-existent route. Note: only `/locations/[location]` is
  verified — a standalone `/locations` index route has not been confirmed and should not be
  assumed or linked until checked.
- **Files likely affected:** `components/Navbar.tsx`.
- **Dependencies:** T-001.
- **Approval required:** Yes.
- **Completion criteria:** Navbar approved, links only to verified existing routes, logo renders
  correctly, no broken links.
- **Status:** TODO

### T-006 — Resolve Geist vs. Inter typography contradiction (DEC-008)
- **Why it matters:** `globals.css` currently wires the sans-serif token to Geist, not Inter,
  contradicting an approved decision.
- **Scope:** Either implement Inter as approved, or propose updating DEC-008 with a stated reason
  if Geist is preferred going forward.
- **Files likely affected:** `app/globals.css`, `app/layout.tsx` (font import).
- **Dependencies:** None.
- **Approval required:** Yes (enforcing or changing an approved decision is a decision either way).
- **Completion criteria:** Typography in code matches the current DECISIONS.md entry, or
  DECISIONS.md is updated to reflect an approved change.
- **Status:** TODO

### T-007 — Fix currency mojibake in `data/properties.json`
- **Why it matters:** `priceDisplay` values render `â‚¹` instead of `₹` due to an encoding
  mismatch — a data-integrity bug with no design judgment involved.
- **Scope:** Re-save `data/properties.json` as UTF-8 and correct the rupee symbol in all
  `priceDisplay` fields.
- **Files likely affected:** `data/properties.json`.
- **Dependencies:** None.
- **Approval required:** No — technical correction only.
- **Completion criteria:** All `priceDisplay` values render `₹` correctly in the browser.
- **Status:** TODO

### T-008 — Replace placeholder/demo inventory with real, verified listings
- **Why it matters:** Current `data/properties.json` entries are confirmed placeholder/demo data
  and must not be presented as real inventory in production (PROJECT_STATUS.md §5). This is a
  hard production-launch blocker.
- **Scope:** Source and enter real, currently marketable, verified property listings for the
  approved current market (per T-002 outcome).
- **Files likely affected:** `data/properties.json`, related images in `public/properties/`.
- **Dependencies:** T-002.
- **Approval required:** Yes — this is business evidence, not a code task.
- **Completion criteria:** All published listings are real, verified, and owner-confirmed as
  currently marketable.
- **Status:** BLOCKED (blocked by real inventory/business evidence, not by implementation effort)

### T-009 — Lint/build verification after each implementation batch
- **Why it matters:** Standing verification discipline; prevents regressions across the above
  tasks.
- **Scope:** Run `npm run lint` and `npm run build` after any code change batch from this backlog;
  record pass/fail.
- **Files likely affected:** None directly; verification step.
- **Dependencies:** Runs after any of T-002, T-003, T-004, T-005, T-006, T-007 that involve code
  changes.
- **Approval required:** No.
- **Completion criteria:** Lint and build both pass with no new errors/warnings introduced.
- **Status:** TODO (recurring)

### T-010 — Final pre-launch verification gate: mobile, accessibility, performance, SEO, lead-flow
- **Why it matters:** Final check before treating the site as launch-ready; confirms the
  foundations in PROJECT_CONTEXT.md §9 and the lead-generation priorities actually work
  end-to-end.
- **Scope:** Manual check of mobile responsiveness, basic accessibility (contrast, alt text,
  keyboard nav), Core Web Vitals/Lighthouse pass, sitemap/robots correctness, and a full
  WhatsApp/Call/enquiry-form test from a real device.
- **Files likely affected:** Potentially any, depending on findings.
- **Dependencies:** T-001 through T-009 should be resolved first.
- **Approval required:** No for the check itself; Yes for any fixes it surfaces.
- **Completion criteria:** All checks pass or have documented, owner-accepted exceptions.
- **Status:** BLOCKED (blocked by upstream NOW tasks)

---

## NEXT — After NOW tasks and foundations are stable

- **`/projects` vs `/properties` route-purpose review** — both routes exist and compile; confirm
  distinct purpose or consolidate.
- **Duplicate/dead-code component investigation and cleanup** (`FeaturedA/B/C`,
  `FeaturedProperties`, `WhyPinnaclProperties`, `EnquiryForm`, `PropertyCardA/B`, `ProjectsGrid`)
  — verify disposition before any deletion.
- **Documentation cleanup under `components/`** — migrate the two facts not recorded elsewhere
  (deployment: GitHub + Vercel; domain: pinnaclproperties.com) into a root document, then
  archive/delete `components/PROJECT_STATUS.md`, `components/DECISIONS.md`, `components/BUGS.md`.
- **Owned OG/social-share asset** to replace the external Unsplash dependency in `layout.tsx` and
  `page.tsx`.
- **Metadata consolidation** between `layout.tsx` and `page.tsx` to remove redundant/overlapping
  OG/Twitter definitions.
- **Zoho CRM adoption evaluation** — only once lead volume/operational complexity justifies it
  (DEC-012).
- **WhatsApp automation evaluation** (Make.com or API) — only once manual handling becomes
  insufficient.
- **FAQ page** — PROJECT_CONTEXT.md §7 NEXT item.
- **Location pages expansion** — only as new markets are genuinely served (DEC-003 revisit
  trigger); also the point at which a standalone `/locations` index route, if desired, would be
  scoped.
- **Rent feature** — explicitly NEXT per DEC-010; requires an explicit owner decision to actively
  offer rental advisory before any scoping begins.

---

## LATER — Only when business volume, inventory, content, or revenue justifies them

Per PROJECT_CONTEXT.md §7 LATER list — not re-scoped here until closer to relevant:
Blog/Market Insights, Advanced Search/Filters, Virtual Tours, Testimonials at scale, Builder pages,
Admin Dashboard/CMS (Sanity).

---

## NOT YET — Explicitly deferred

Per PROJECT_CONTEXT.md §7 NOT YET list, unchanged: AI Property Recommendation, AI Chat Assistant,
Saved Properties/User Accounts, Multi-city/Multi-agent systems, Booking System, Payment
Integration, Large-scale SEO page generation, Off-market listing platforms, Complex
personalization/enterprise infrastructure.

---

_This backlog should be revised only through the same review discipline as code: identify
context, compare options where a decision is involved, get owner approval, then update status._