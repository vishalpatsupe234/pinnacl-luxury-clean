# DECISIONS.md — Pinnacl Properties

_This document records explicit, approved, durable project decisions only. It is a decision log,
not a description of the business or a copy of Project Instructions — see PROJECT_CONTEXT.md and
Project Instructions for full context. Future agents/developers should not reopen these decisions
without a justified business, UX, technical, or brand reason._

---

## DEC-001 — Brand Principle
- Status: Approved
- Decision: The brand principle is "Luxury. Trust. Simplicity." All brand, design, content, and
  product decisions must support this principle.
- Reason: Establishes a single, consistent identity anchor for a premium advisory brand built
  from an early stage.
- Revisit when: A brand-system review identifies a clear reason to evolve brand principles.

---

## DEC-002 — Current Business Stage
- Status: Approved
- Decision: Pinnacl Properties is an early-stage, founder-led, bootstrapped real estate
  consultancy. No inventory, transaction history, client base, team, or capital beyond what
  actually exists should be assumed or implied.
- Reason: Ensures messaging, features, and technical decisions match real business capability
  rather than aspirational scale.
- Revisit when: The business reaches a materially different operating stage with evidence
  (revenue, team, inventory, transaction history) to support repositioning.

---

## DEC-003 — Initial Execution Market
- Status: Approved
- Decision: Ambernath and nearby practical markets are the initial execution and market
  validation market.
- Reason: Enables the business to build local market knowledge, developer/channel relationships,
  credible inventory access, leads, transactions, and operating experience before expanding.
- Revisit when: Sufficient evidence (relationships, inventory, transactions, revenue) supports
  expansion to the next stage in the approved growth direction.

---

## DEC-004 — Geographic Growth Direction
- Status: Approved
- Decision: Approved growth path is Ambernath and nearby markets → Thane and Navi Mumbai →
  selected Mumbai markets and the Mumbai luxury segment → selected premium markets across India.
  Global expansion is not part of the approved roadmap.
- Reason: Provides a realistic, evidence-based expansion path aligned with long-term brand
  ambition without overstating current or near-term geographic scope.
- Revisit when: Mumbai/MMR presence and economics are proven and a specific new-market
  opportunity is evaluated on its own merits.

---

## DEC-005 — Premium Positioning Without Unsupported Claims
- Status: Approved
- Decision: The brand is positioned as premium from Day 1, but the website and all communications
  must not claim scale, clients, transactions, inventory, partnerships, or market leadership that
  are not actually true.
- Reason: Protects long-term trust and credibility, which are core brand values, over short-term
  perception gains.
- Revisit when: Not applicable — this is a standing integrity constraint, not a stage-dependent
  decision.

---

## DEC-006 — Bootstrap-First, Revenue-Funded Growth
- Status: Approved
- Decision: Growth is funded by bootstrapping and business revenue. Commissions and profits are
  reinvested progressively into the highest-leverage opportunities as they are validated.
  Unnecessary subscriptions, infrastructure, tooling, automation, or hiring are avoided.
- Reason: Protects limited capital and ensures spending is justified by real operational need and
  evidence, not by technical possibility or competitor comparison.
- Revisit when: Revenue and operating evidence justify a materially different capital approach
  (e.g., external funding, larger reinvestment budget).

---

## DEC-007 — Current Project Phase
- Status: Approved
- Decision: The current project phase is Lean MVP, Market Validation, and Initial Operations.
  Scope is limited to what this phase requires: a credible premium website, truthful positioning,
  trust building, lead generation, WhatsApp/Call actions, simple lead capture, fast manual
  response, mobile experience, performance, accessibility, technical SEO foundations, and basic
  measurement.
- Reason: Prevents premature build-out of features or systems the business does not yet need.
- Revisit when: Stage 1 evidence (per PROJECT_CONTEXT.md growth roadmap) is met and the
  project owner approves progression to Stage 2.

---

## DEC-008 — Typography System
- Status: Approved
- Decision: Playfair Display + Inter is the approved current typography system.
- Reason: Establishes a consistent, premium typographic identity aligned with the quiet-luxury
  design direction.
- Revisit when: A future brand-system review provides a clear reason to change it.

---

## DEC-009 — Color and Design Direction
- Status: Approved
- Decision: The design direction is black, white, warm neutrals, and restrained gold accents.
  Gold is used sparingly as an accent, not as a dominant or decorative element.
- Reason: Supports a quiet-luxury aesthetic consistent with premium real estate reference brands
  while avoiding visual clutter or clichéd luxury signaling.
- Revisit when: A future brand-system review provides a clear reason to change it.

---

## DEC-010 — Rent Feature Scope
- Status: Approved
- Decision: "Rent" is classified as NEXT. It is not part of the current Lean MVP scope unless the
  project owner explicitly decides to actively offer and market rental advisory services.
- Reason: Keeps current-phase scope focused on validated core business activity (Buy/advisory)
  rather than expanding scope without a stated business decision to offer rentals.
- Revisit when: The project owner explicitly approves offering rental advisory services.

---

## DEC-011 — RERA Information Scope
- Status: Approved
- Decision: Accurate, verified, property/project-specific RERA information is classified as NOW
  where applicable and available for actual listed properties. A separate, complex RERA
  system/database is not part of the current phase.
- Reason: Provides legitimate trust/compliance information without introducing operational
  complexity the current inventory volume does not justify.
- Revisit when: Inventory volume, verification workflow needs, or regulatory requirements justify
  a dedicated RERA data system.

---

## DEC-012 — Technology Adoption Criteria
- Status: Approved
- Decision: Technologies listed as "preferred long-term direction" (e.g., Supabase, Prisma,
  Cloudinary, Sanity, Zoho CRM, WhatsApp automation) are not pre-approved for implementation.
  Each is introduced only when justified by an actual, current business need, evaluated against
  problem, cost, complexity, and simpler alternatives.
- Reason: Prevents premature infrastructure adoption and unnecessary recurring cost or
  operational complexity at an early business stage.
- Revisit when: A specific tool is proposed with a demonstrated current business need; evaluated
  case by case.

---

## DEC-013 — Advanced Capabilities Are NOT YET
- Status: Approved
- Decision: AI property matching/chat assistants, VIP portals, user accounts, booking systems,
  payment integration, complex personalization, off-market listing platforms, and enterprise
  infrastructure are classified NOT YET. They are not part of the current or near-term roadmap.
- Reason: These capabilities require business maturity, evidence of demand, and operational scale
  the business does not currently have; building them now would be premature and capital-inefficient.
- Revisit when: Business maturity, demand evidence, ROI justification, and operational need are
  demonstrated and the project owner explicitly approves evaluation.

---

## DEC-014 — Major Design Decisions Require Approval
- Status: Approved
- Decision: Major design and architecture decisions (e.g., hero treatment, homepage structure,
  navigation, search experience, property-card system, lead-generation flow, overall visual
  direction) must be presented as options with trade-offs and a recommendation, and require
  explicit project-owner approval before implementation.
- Reason: Prevents unilateral or unreviewed changes to brand-critical, conversion-critical
  decisions.
- Revisit when: Not applicable — this is a standing workflow rule.

---

## DEC-015 — Competitor Brands Are References, Not Templates
- Status: Approved
- Decision: Oppenheim Group, Douglas Elliman, Savills, DAMAC, Emaar, Sotheby's International
  Realty, Compass, and similar brands are used only as references for quality standards, UX
  patterns, and positioning strategy. Their websites, layouts, content, or identity must not be
  copied.
- Reason: Maintains a distinctive Pinnacl Properties identity while still benchmarking against
  credible premium real estate brands.
- Revisit when: Not applicable — this is a standing workflow rule.

---

## DEC-016 — Existing Code Is Context, Not Approved Design
- Status: Approved
- Decision: Uploaded code files and repository code are treated as implementation context only.
  They do not automatically represent approved design or business decisions.
- Reason: Prevents past unreviewed implementation choices from being mistaken for settled,
  approved direction.
- Revisit when: Not applicable — this is a standing workflow rule.

---

## DEC-017 — Growth Roadmap Is Evidence-Based, Not Feature-Driven
- Status: Approved
- Decision: The long-term roadmap is structured around business-stage evidence (Lean Launch →
  Repeatable Local Operations → Mumbai/MMR Growth → India-Wide Expansion), not around a fixed
  sequence of technology features. Advanced technology capabilities are evaluated independently
  against demand, ROI, and operational need, not tied automatically to any stage.
- Reason: Avoids the incorrect assumption that shipping more technology equals business maturity;
  keeps expansion tied to real operating evidence.
- Revisit when: Not applicable — this is a standing structural principle for the roadmap;
  individual stage transitions are evaluated against their stated triggers in PROJECT_CONTEXT.md.