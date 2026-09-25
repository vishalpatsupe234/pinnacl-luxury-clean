# PINNACL PROPERTIES — MASTER SYSTEM MAP

**Compiled:** 2026-09-22 · **Mode:** read-only audit · **Repo:** `C:\Users\VISHAL\Desktop\pinnacl-luxury-clean` · **Branch:** `stable` · **HEAD:** `d4669b58`

> ## ⚠️ SUPERSEDED IN PART — READ THIS FIRST
>
> **This is a point-in-time audit snapshot of 2026-09-22.** It is deliberately preserved unrewritten, because it records the state that motivated the remediation work that followed. It is **not** a current-state document.
>
> **Both headline findings below have since been resolved:**
>
> - **Finding 1 (stale production build) — RESOLVED 2026-09-24** by deploying commit `f3140c77`. Production no longer serves the pre-Supabase build: `/api/properties` is gone, the three placeholder listings are gone, and the pre-registration holding notice is live.
> - **Finding 2 (anonymous read of `invites`, tokens included) — RESOLVED** by `supabase/migrations/20260923090000_invites_enable_rls.sql`. Anonymous callers now read zero rows from `invites`.
>
> **Consequently, every "old build" / "not deployed" / "REPO ONLY" / "→ 500" claim below — including the whole `LIVE?` column in Part 2 — describes the historical 2026-09-22 state and should not be read as current.** The same applies to every reference to Findings 1 and 2 throughout.
>
> **Current state is documented separately in [`docs/SECURITY_STATE_CHECKPOINT.md`](./SECURITY_STATE_CHECKPOINT.md).** Where the two disagree, the checkpoint is authoritative.
>
> Three stale environment facts have been corrected in place rather than left to mislead — the Google credential variable (§Part 4), the `lib/.env.local` tracking status (Parts 4 and 9), and J10's location (Parts 2, 10 and 23). Each correction is marked inline. Nothing else has been rewritten.

This document describes the system as it actually is on 2026-09-22. Nothing here was built, changed, fixed or deployed while writing it. Every major claim carries an `EVIDENCE:` line pointing at a file, migration, query result or production probe. Where evidence is missing, the entry says `UNKNOWN` or `NOT VERIFIED` instead of guessing.

> **Two findings dominate this report. Read them first.**
>
> **FINDING 1 — production is running an old build.** `https://pinnaclproperties.com` serves a pre-Supabase version of the site: the removed `/api/properties` endpoint still answers, the sitemap still lists three placeholder listings, and `/broker/login` and `/admin/*` return HTTP 500. Almost everything described as "built" in this repo — Supabase property data, the CMS, broker auth, the lead CRM, the compliance gate, Stage 0 and Stage 1 — **is not what the public currently sees.**
> EVIDENCE: `curl https://pinnaclproperties.com/api/properties` → `200`, body begins `[{"id":"crest-001","slug":"pinnacl-crest-powai",...` with `â‚¹` mojibake; `/sitemap.xml` lists `pinnacl-crest-powai`, `pinnacl-aurelia-bkc`, `pinnacl-bayview-worli`; `/broker/login` → `500`; probes run 2026-09-22.
>
> **FINDING 2 — the `invites` table is readable by anonymous callers, including the token.** Using only the public key, `select token from invites` returns the invite token and the invitee's email address. The migration enables RLS and creates an admin-only policy, so live state and repo intent disagree. Root cause is NOT VERIFIED (cannot read `pg_policies` over PostgREST).
> EVIDENCE: anon `select("token")` → 1 row, token `[TOKEN REDACTED]`; raw REST `GET /rest/v1/invites?select=id` → HTTP 200, `content-range: 0-0/1`; intended policy in `supabase/migrations/20260817090000_broker_auth_invites.sql:65-71`.

---

## PART 1 — EXECUTIVE SUMMARY

**1. What is Pinnacl Properties today?**
A luxury real-estate marketing website with a private back office behind it. The public side shows the brand and collects enquiries. The private side, which only you and invited brokers can reach, manages listings and enquiries. The back office works in the codebase and against the live database, but it is not deployed to the live domain.

**2. What business model is it becoming?**
An invite-only network. Verified brokers and developer partners supply and work inventory under one owner's platform, every project and unit has a provable origin, and commissions are eventually tracked per deal. Growth is gated by manual approval, not open signup.
EVIDENCE: `CLAUDE.md` §6, §11; `supabase/migrations/20260922090400_stage1_j5_sources_units_claims.sql` header.

**3. Website, broker system, CRM, inventory network or transaction platform?**
Today it is **a website plus a small CRM plus an admin listings tool**. The inventory network exists as an empty, well-designed database skeleton. The transaction and commission platform is schema only — no application code touches it.
EVIDENCE: row counts in Part 5; repo-wide grep shows zero code references to `deals`, `commission_ledger`, `site_visits`.

**4. Major subsystems in the repo**
Public marketing site · invite-only broker/admin authentication · property CMS · lead capture and CRM · compliance/pre-registration layer · Stage 1 canonical project and inventory schema (empty) · transaction and commission schema (empty).

**5. Production-safe today**
The public marketing pages, the lead-capture API with validation and escaping, the admin CMS, the broker read-only catalogue, the lead CRM, and the Stage 0/Stage 1 database work — all verified by `npm run lint`, `npm run build` and a local production smoke test on 2026-09-22. "Production-safe" here means the code is sound, **not** that it is deployed.

**6. Experimental or planned**
Canonical projects, developers, source parties, inventory units, availability claims, duplicate review, deals, commissions, site visits, broker self-upload, and the separate "Pinnacl Pro" B2B product.

**7. Intentionally switched off**
Public property listings, in the repo build only. Because no MahaRERA agent registration number is configured, the site runs in pre-registration mode: `/properties` shows a holding notice, detail pages 404, and no property appears in the sitemap. This is a deliberate compliance gate, not a bug.
EVIDENCE: `lib/compliance/publicMode.ts:65-85`; local build probe: `/properties/lodha-world-towers-lower-parel` → 404 with an empty sitemap.

**8. The single most important architectural direction**
**Separate identity from evidence, and never let one field imply a right.** A project is an identity; who supplied it is separate evidence; whether a unit is available is a dated claim by a named party, not a stored flag; and no one earns commission because of a data-entry field. Everything in Stage 1 follows from that.

---

## PART 2 — CURRENT SYSTEM STATUS

"LIVE" below means **live on the public production domain**. Many items are fully built and working against the live database yet are not deployed — those read `REPO ONLY`.

| AREA | STATUS | LIVE? | SOURCE OF TRUTH | NOTES |
|---|---|---|---|---|
| Public website | PARTIALLY LIVE | Yes, old build | Vercel deployment | Live site predates Supabase migration |
| Homepage | PARTIALLY LIVE | Yes, old build | `app/page.tsx` (repo) vs deployed JSON build | Repo version reads Supabase; live version does not |
| About | LIVE | Yes | `app/about/page.tsx` | Live copy still shows "50+ / Projects Curated" |
| Contact | LIVE | Yes | `app/contact/page.tsx` | |
| Properties listing | PARTIALLY LIVE | Yes, old build | `app/properties/page.tsx` | Live serves placeholder JSON listings; repo build serves a holding notice |
| Property detail | PARTIALLY LIVE | Yes, old build | `app/properties/[slug]/page.tsx` | Live `/properties/pinnacl-crest-powai` → 200; repo build 404s all detail pages |
| Locations | REPO ONLY | Not verified | `app/locations/[location]/page.tsx` | Redirects to `/properties`, gated by pre-registration mode |
| Projects redirect | REPO ONLY | No | `app/projects/page.tsx` | Repo: 308 → `/properties`. Live: renders 200 |
| Admin | REPO ONLY | No | `app/admin/*` | Live `/admin/properties` → 500 |
| Broker | REPO ONLY | No | `app/broker/*` | Live `/broker/login` → 500 |
| Authentication | REPO ONLY | No | Supabase Auth + `proxy.ts` | Works locally against live DB |
| Property CMS | REPO ONLY | No | `app/admin/properties/*` | Full CRUD, image upload, soft delete |
| Approval workflow | PARTIALLY LIVE | No | `properties.approval_status` | Enforced in DB and repo code; not reachable in production |
| Lead CRM | REPO ONLY | No | `app/admin/leads/*`, `app/broker/leads/*` | Assign, status, notes |
| Lead capture | LIVE | Yes, old build | `app/api/leads/route.ts` | Live version predates the hardening pass — NOT VERIFIED which validation it has |
| Google Sheets integration | PARTIALLY LIVE | Not verified | `app/api/leads/route.ts` | Requires env vars; live behaviour NOT VERIFIED |
| Email integration (Resend) | PARTIALLY LIVE | Not verified | `app/api/leads/route.ts` | Same |
| WhatsApp CTA | LIVE | Yes | `components/Hero.tsx`, `FloatingAction.tsx` | `PropertyDetails.tsx` still has placeholder `wa.me/91XXXXXXXXXX` |
| Supabase | LIVE (database) | Backend only | Supabase project | Database is live and current; the deployed site does not use it |
| Storage | LIVE | Backend only | Buckets `property-images`, `properties` | Two buckets; legacy paths resolve to `properties` |
| RLS | LIVE | Backend only | `supabase/migrations/*` | Enforced; one confirmed exception (`invites`) |
| Audit logging | LIVE | Backend only | `log_audit_event()` | 56 rows |
| RERA/compliance layer | REPO ONLY | No | `lib/compliance/*`, `components/ReraDisclosure.tsx` | Not deployed; live site shows unsupported claims |
| Pre-registration mode | REPO ONLY | No | `lib/compliance/publicMode.ts` | Active in repo builds, absent in production |
| Stage 0 | LIVE (database) | Backend only | 2026-09-21 migrations | Broker scope narrowed, audit provenance + PII redaction |
| Stage 1 | LIVE (database) | Backend only | J1–J9 | Tables exist, empty except reference rows |
| Stage 1B | PARTIALLY LIVE | Backend only | This audit series | 2 test rows excluded; Lodha unmapped |
| J1 reference tables | LIVE | Backend only | `20260922090000` | 4 + 3 rows |
| J2 seed rows | LIVE | Backend only | `20260922090100` | 7 reference rows present |
| J3 developers/source_parties | LIVE | Backend only | `20260922090200` | Both empty |
| J4 projects | LIVE | Backend only | `20260922090300` | Empty |
| J5 sources/units/claims | LIVE | Backend only | `20260922090400` | All empty |
| J6 duplicate candidates | LIVE | Backend only | `20260922090500` | Empty; detection never run |
| J7 PII redaction extension | LIVE | Backend only | `20260922090600` | Function replaced |
| J8 effective availability view | LIVE | Backend only | `20260922090700` | View returns 0 rows |
| J9 properties linkage | LIVE | Backend only | `20260922090800` | 3 columns added |
| J10 verification | LIVE (read-only) | N/A | `20260922090900` _(corrected: relocated to `supabase/verification/` on 2026-09-24 — it is not a migration and must never be applied as one)_ | Not a migration; reported passing by owner, output NOT VERIFIED here |
| Legacy properties | LIVE (database) | Partly | `public.properties` | 3 rows: 1 unmapped, 2 excluded |
| Canonical project system | PLANNED | No | `projects`, `developers` | Empty by design |
| Inventory system | PLANNED | No | `inventory_units`, claims | Empty by design |
| Duplicate detection | PLANNED | No | `detect_project_duplicates()` | Function exists, never invoked |
| Transaction/deal system | PLANNED | No | `deals` | Schema only, zero code references |
| Commission system | PLANNED | No | `commission_ledger` | Schema only, zero code references |
| Site visit system | PLANNED | No | `site_visits` | Schema only, zero code references |
| Future collaboration system | PLANNED | No | None | No table exists |

EVIDENCE: production probes 2026-09-22; `npm run build` route table (24 routes); row counts via service-role `head:true` counts; repo-wide grep for `.from("…")`.

---

## PART 3 — PRODUCT ARCHITECTURE

### A. Public marketing / customer surface

- **Purpose:** present the brand and capture enquiries.
- **Users:** anonymous visitors. No account, ever.
- **Routes:** `/`, `/about`, `/contact`, `/properties`, `/properties/[slug]`, `/projects` (redirect), `/locations/[location]` (redirect), `/sitemap.xml`, `/robots.txt`.
- **Data source (repo build):** Supabase `properties`, read directly from Server Components; `PropertiesList` queries from the browser with the public key. Visibility is decided by RLS, not by the client.
- **APIs:** `POST /api/leads` only.
- **Authentication:** none. **Permissions:** anonymous RLS policies only.
- **Dependencies:** Supabase, Google Sheets, Resend, WhatsApp deep links, Supabase Storage for images.
- **Current limitations:** pre-registration mode hides all inventory; four separate enquiry-form implementations; `PropertyDetails.tsx` has a dead "Schedule Visit" button and a placeholder WhatsApp number; the deployed build is stale.

### B. Admin / broker back office

- **Purpose:** manage listings, brokers and enquiries.
- **Users:** one super admin; invited brokers/sales partners.
- **Routes:** `/broker/login`, `/broker/accept-invite`, `/broker/dashboard`, `/broker/properties`, `/broker/properties/[id]`, `/broker/leads`, `/broker/leads/[id]`, `/admin/brokers`, `/admin/properties`, `/admin/leads`.
- **APIs:** `/api/admin/{invites,brokers/[id],properties,properties/[id],leads,leads/[id],leads/[id]/notes}`, `/api/broker/{accept-invite,properties,leads,leads/[id],leads/[id]/notes}`.
- **Authentication:** Supabase Auth; session refreshed by `proxy.ts`, scoped to `/broker/*` and `/admin/*`.
- **Permissions:** every gated route calls `getSessionProfile()` and checks role and status; RLS enforces the same rules in the database. The service-role key is used in exactly one route (accept-invite) and is guarded by `server-only`.
- **Current limitations:** the broker dashboard is a placeholder; brokers cannot upload listings; no deal, commission or site-visit UI exists.

```
                    ┌──────────────────────────────┐
     VISITOR ──────▶│  PUBLIC WEBSITE (Next.js)    │
     (anonymous)    │  / /about /contact           │
                    │  /properties /properties/:slug│
                    └───────┬───────────────┬──────┘
                            │               │ direct RLS-scoped SELECT
              POST /api/leads               │ (anon key, server + client)
                            ▼               │
                    ┌──────────────┐        │
                    │ /api/leads   │        │
                    │ validate +   │        │
                    │ escape +     │        │
                    │ rate limit   │        │
                    └───┬───┬───┬──┘        │
                        │   │   │           │
        ┌───────────────┘   │   └────────┐  │
        ▼                   ▼            ▼  ▼
   ┌─────────┐      ┌──────────────┐   ┌──────────────────────────┐
   │ Google  │      │   Resend     │   │        SUPABASE          │
   │ Sheets  │      │ owner email  │   │ Postgres + RLS + Auth +  │
   └─────────┘      └──────────────┘   │ Storage + audit triggers │
                                       └───────┬──────────────────┘
                                               │
                        ┌──────────────────────┴───────────────────┐
                        │        ADMIN / BROKER BACK OFFICE        │
                        │  /admin/{brokers,properties,leads}       │
                        │  /broker/{dashboard,properties,leads}    │
                        │  session via proxy.ts, role via RLS      │
                        └──────────────────────┬───────────────────┘
                                               │
                        ┌──────────────────────┴───────────────────┐
                        │   FUTURE TRANSACTION SYSTEM (empty)      │
                        │   site_visits · deals · commission_ledger│
                        │   projects · inventory_units · claims    │
                        └──────────────────────────────────────────┘
```

---

## PART 4 — COMPLETE TECH STACK

### Currently used

| Technology | Version | Where |
|---|---|---|
| Next.js (App Router, Turbopack) | ^16.3.5 | whole app |
| React / React DOM | 19.2.0 | whole app |
| TypeScript | ^5 | whole app |
| Tailwind CSS | ^4 (+ `@tailwindcss/postcss`) | styling |
| `@supabase/supabase-js` | ^2.112.3 | all DB access |
| `@supabase/ssr` | ^0.12.4 | cookie-based sessions, `proxy.ts` |
| `server-only` | ^0.0.1 | guards the service-role client |
| PostgreSQL via Supabase | managed | database, RLS, triggers |
| Supabase Auth | managed | broker/admin login |
| Supabase Storage | managed | buckets `property-images`, `properties` |
| `resend` | ^6.17.2 | owner notification email |
| `googleapis` | ^173.0.0 | Google Sheets append |
| `motion` | ^13.1.0 | editorial reveals, navbar |
| `lenis` | ^1.3.26 | smooth scroll |
| `react-icons` | ^5.5.0 | icons in use |
| `clsx` + `tailwind-merge` | — | `lib/utils.ts` |
| `sharp` (dev) | ^0.35.4 | one-off image script |
| Vercel | — | hosting; live IP 76.76.21.21 |
| GitHub | — | `vishalpatsupe234/pinnacl-luxury-clean` |

**Analytics:** none. No Google Analytics, GTM or other tag anywhere.
EVIDENCE: `next.config.js` CSP comment and repo grep.

**Environment configuration:** `.env.local` contains `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_JSON` _(corrected: this entry originally read `GOOGLE_SERVICE_ACCOUNT_KEY_PATH`, which no runtime code uses)_, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `OWNER_NOTIFICATION_EMAIL`, `VERCEL_OIDC_TOKEN`. **Not set:** `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_MAHARERA_AGENT_REG_NO`, `NEXT_PUBLIC_PRE_REGISTRATION_PUBLIC_MODE`, `GOOGLE_SHEET_RANGE`. The missing MahaRERA number is what activates pre-registration mode.

### Installed but unused

`framer-motion` (superseded by `motion`), `react-slick` + `slick-carousel` + `types/react-slick.d.ts`, `embla-carousel-react`, `lucide-react` (second icon library), `shadcn` + `@base-ui/react` + `class-variance-authority` + `tw-animate-css` (the four `components/ui/*` primitives have zero page imports), `baseline-browser-mapping`.

### Legacy

`lib/properties.ts` and `components/lib/properties.ts` (dead duplicate data), 16 orphaned components, `components/layout/*`, `lib/.env.local` _(corrected: no longer tracked — removed from git by commit `c7e5ce8c`; the file remains on disk and is gitignored)_, `public/properties/*.jpg|webp` (placeholder images), `docs/reference/*` (stale).

### Recommended future

Only what the repo already documents: regenerate `lib/supabase/types.ts` once CLI access exists; reconcile the two CSS token systems before first use of `components/ui/*`; Inter vs Geist typography (DEC-008 unresolved); shared Supabase-backed rate limiting for `/api/leads`. No replacement technology is recommended here.

---

## PART 5 — DATABASE MASTER MAP

Row counts read 2026-09-22 with the service-role key (SELECT only). "Anon visible" is what the public key returns.

| Table | Rows | Anon visible | Live/Empty/Legacy |
|---|---|---|---|
| properties | 3 | 1 | LIVE |
| builders | 4 | 3 | LIVE (mostly seeded) |
| profiles | 2 | 0 | LIVE |
| leads | 15 | 0 | LIVE (all soft-deleted) |
| lead_notes | 0 | 0 | EMPTY |
| site_visits | 0 | 0 | EMPTY |
| deals | 0 | 0 | EMPTY |
| commission_ledger | 0 | 0 | EMPTY |
| invites | 1 | **1 — see Finding 2** | LIVE |
| audit_log | 56 | 0 | LIVE |
| source_party_precedence | 4 | 0 | LIVE (reference) |
| inventory_freshness_policies | 3 | 0 | LIVE (reference) |
| developers | 0 | 0 | EMPTY |
| source_parties | 0 | 0 | EMPTY |
| projects | 0 | 0 | EMPTY |
| project_sources | 0 | 0 | EMPTY |
| inventory_units | 0 | 0 | EMPTY |
| unit_availability_claims | 0 | 0 | EMPTY |
| project_duplicate_candidates | 0 | 0 | EMPTY |
| inventory_units_effective (view) | 0 | 0 | EMPTY |

Policy, trigger and index details below come from the migration files. Live policy state could not be read directly (PostgREST does not expose `pg_catalog`), so it is `NOT VERIFIED` except where a behavioural probe confirmed it.

### properties
- **Purpose:** the legacy listing table; still authoritative for the public site.
- **Read:** anon + authenticated where `approval_status='approved' and deleted_at is null`; active brokers, same condition (Stage 0); own source rows at any status; super admin everything.
- **Insert/Update/Delete:** super admin only. Broker insert/update policies were dropped in Stage 0. No hard delete — `deleted_at` only.
- **RLS:** enabled. **Audit trigger:** `properties_audit`. **Other triggers:** `properties_set_updated_at`, `properties_source_broker_immutable`.
- **FKs:** `builder_id → builders`, `source_broker_id → profiles`, `project_id → projects` (J9), `inventory_unit_id → inventory_units` (J9).
- **Future role:** stays in place through Stage 2 as the public surface, gradually pointing at canonical records.

### builders
- Legacy developer names. Anon may read `verified` rows; super admin writes. Audit trigger present. Superseded conceptually by `developers`, but never dropped.

### profiles
- One row per account, carrying `role`, `status`, `kyc_status`. Self-read plus admin-read; self-update restricted by `enforce_profile_role_change_admin_only()`, which blocks non-admins from changing `role`, `status` or `kyc_status` (AUD-01 fix, verified live by the owner 2026-09-19).

### leads
- **Insert: anyone, including anonymous** (`leads_public_insert with check (true)`). Read/update: assigned broker or admin. Audit trigger redacts buyer PII. 15 rows, all soft-deleted, 3 attached to the Lodha property, 12 with no property.

### lead_notes
- Notes on a lead. Broker may insert/read notes on their own assigned leads; admin full read plus insert. Empty. Audit trigger present.

### site_visits / deals / commission_ledger
- Append-only visits; two-broker deals with admin verification; an immutable ledger whose shares must sum to the gross. All three are empty and **no application code references them**. `deals` INSERT policies were tightened on 2026-09-18 and verified live by the owner.

### invites
- The only path to an account. Intended admin-only. **Live behaviour contradicts this — see Finding 2.**

### audit_log
- Append-only. Admin read only; no update or delete policy for any role. 56 rows. Written by `log_audit_event()`.

### Stage 1 tables
`source_party_precedence` (4 rows) and `inventory_freshness_policies` (3 rows) hold tunable business policy. `developers`, `source_parties`, `projects`, `project_sources`, `inventory_units`, `unit_availability_claims`, `project_duplicate_candidates` are all admin-only, all empty, all audited, and none is reachable by anon — confirmed by probe (0 rows each under the public key, including the seeded reference tables).

### Views, functions and triggers

| Object | Kind | Role |
|---|---|---|
| `inventory_units_effective` | view, `security_invoker = true` | Derives availability per unit from claims: winning claim by live precedence then recency, staleness from the freshness policy, `has_conflicting_claim`, `is_publishable` |
| `log_audit_event()` | trigger fn, SECURITY DEFINER, `search_path=public` | Writes every audited change with `actor_type` (`authenticated_user`/`public_form`/`service_role`/`system`) |
| `redact_audit_pii(jsonb)` | fn, IMMUTABLE | Replaces known personal-data keys with `[redacted]`; J7 added `display_name` and `resolution_note` |
| `detect_project_duplicates()` | fn, SECURITY INVOKER + `is_super_admin()` guard | Raises candidates only; never merges |
| `is_super_admin()`, `is_active_broker()` | fns | Role checks used throughout RLS |
| `set_updated_at()` | trigger fn | Timestamp maintenance |
| `enforce_profile_role_change_admin_only()` | trigger fn, SECURITY DEFINER | Blocks self-escalation of `role`/`status`/`kyc_status` |
| `enforce_source_broker_immutable()` | trigger fn | `source_broker_id` can never change |
| `enforce_project_source_provenance_immutable()` | trigger fn | Provenance fields frozen; corrections must supersede |
| `enforce_project_source_role_matches_party()` | trigger fn, SECURITY DEFINER | `source_role` must agree with `party_type` |
| `enforce_claim_not_future_dated()` | trigger fn | No future-dated claims |
| `enforce_claim_snapshot_integrity()` | trigger fn, SECURITY DEFINER | Claim's party type and precedence rank must match live reference data |

**Publication invariants (database-enforced):** a project cannot be `verified` or `published` without a registration number, a verification timestamp **and** a named verifier; a developer cannot be `verified` without a timestamp and verifier.
EVIDENCE: `20260922090300_stage1_j4_projects.sql` `projects_publication_invariant_check`; `20260922090200_..._j3_...sql` `developers_verified_requires_evidence_check`.

---

## PART 6 — DATABASE RELATIONSHIP DIAGRAM

```
CANONICAL CHAIN (all tables exist, all empty)

   developers ──────────┐
      │ legacy_builder_id│ developer_id
      ▼                  ▼
   builders (legacy)   projects ──── merged_into_id ──┐ (self, manual merge)
                          │  ▲                        │
                          │  └────────────────────────┘
        ┌─────────────────┼──────────────────┐
        ▼                 ▼                  ▼
  project_sources   inventory_units   project_duplicate_candidates
   (provenance)          │              (a_id/b_id → projects)
        │                ▼
        │        unit_availability_claims ──▶ inventory_units_effective (VIEW)
        │                │
        └── source_party_precedence (rank) ──┘
   source_parties ──▶ profile_id → profiles | developer_id → developers


LEGACY LINKAGE (J9 — columns exist, both NULL on all rows)

   properties ── project_id ───────▶ projects
       │      └─ inventory_unit_id ▶ inventory_units
       │      └─ migration_state: unmapped | mapped | needs_manual_mapping | excluded
       ├─ builder_id ▶ builders
       └─ source_broker_id ▶ profiles   (data entry only — NOT sourcing evidence)


TRANSACTION CHAIN (tables exist and are empty, except where marked FUTURE)

   leads ──▶ lead_notes
     │
     ├──▶ site_visits ──▶ properties, profiles
     │
     └──▶ deals ──▶ properties, source_broker_id, closing_broker_id
               │
               └──▶ commission_ledger (gross = platform + source + closing)
                          │
                          ├── payment records ......... FUTURE / PLANNED (no table)
                          ├── disputes ................ FUTURE / PLANNED (no table)
                          ├── deal participants (n-way) FUTURE / PLANNED (no table)
                          ├── collaborations .......... FUTURE / PLANNED (no table)
                          └── documents ............... FUTURE / PLANNED (no table)
                                     │
                              audit_log (exists, live)
```

---

## PART 7 — DATA OWNERSHIP MODEL

| Concept | Where it lives today | Meaning |
|---|---|---|
| **Project Source** | `project_sources` (empty) | Who supplied a project, and under which role. Evidence only. |
| **Inventory Source** | `unit_availability_claims.claimant_party_id` (empty) | Who asserted a unit's availability, and when. |
| **Lead Source** | Not modelled | Which channel produced the enquiry. No column exists. |
| **Lead Owner** | `leads.assigned_broker_id` | Who works the lead. Currently NULL on all 15 rows. |
| **Collaboration Participant** | FUTURE / PLANNED | No table. |
| **Closing Participant** | `deals.closing_broker_id` (empty) | Who closed. |
| **Commission Beneficiary** | `commission_ledger` (empty) | Who is paid what, per deal. |
| **Developer** | `developers` (empty) / `builders` (legacy) | The promoter entity. |
| **Broker** | `profiles.role` + `source_parties.party_type='broker'` | A person; and separately, a party that may be a source. |
| **Referrer** | `source_parties.party_type='referrer'` | Lowest precedence source party. |
| **Pinnacl** | `source_parties.party_type='pinnacl'` | Modelled as a party, deliberately not as a profile. |

**Why `source_broker_id` must never determine commission or ownership**

1. It records **who typed the row in**, not who supplied the listing. The new schema splits those into `submitted_by` and `source_party_id` precisely because collapsing them was the original error.
2. It is permanent and cannot be corrected: `enforce_source_broker_immutable()` blocks any change. Treating an unchangeable data-entry field as an entitlement would make a typo permanent money.
3. It is empirically unreliable. On the one real listing it points at an account whose name matches the owner's own, with KYC still pending, on a row created by hand outside the CMS with no audit actor.
4. Entitlement is structurally inexpressible in `project_sources`: it has no rate, share, percentage, amount, payer or beneficiary column.
5. The decision is written into the migration: "source_broker_id is a data-entry artifact, not sourcing evidence, and is never auto-converted."
EVIDENCE: `20260922090400_stage1_j5_sources_units_claims.sql` header, locked decisions 6 and 7.

```
        WHO TYPED IT            WHO SUPPLIED IT           WHO GETS PAID
              │                        │                        │
     properties.source_broker_id   project_sources     commission_ledger (empty)
     project_sources.submitted_by  .source_party_id             │
              │                        │                        │
              └── data entry ──┐       └── evidence ──┐         └── agreement + proof
                               ▼                      ▼
                         NEVER IMPLIES ────────▶ NEVER IMPLIES ────────▶ ENTITLEMENT
```

---

## PART 8 — PROPERTY SYSTEM

**Where data comes from (repo build):** Supabase `properties`, queried directly by `app/page.tsx`, `app/properties/page.tsx`, `app/properties/[slug]/page.tsx`, `app/sitemap.ts` and `components/PropertiesList.tsx`. The legacy `data/properties.json` and `GET /api/properties` were deleted (F17). **The deployed production build still uses the deleted JSON path.**

**Public visibility rules:** `approval_status = 'approved'` AND `deleted_at IS NULL` (RLS), AND `publicPropertySurfacesEnabled()` in code, which is false while no agent registration number is configured.

**Current rows (3):**

| Title | approval | deleted | featured | migration_state | project_id | inventory_unit_id |
|---|---|---|---|---|---|---|
| Lodha World Towers | approved | live | yes | `unmapped` | NULL | NULL |
| TEST APPROVAL DELETE ME | rejected | 2026-09-20 | no | `excluded` | NULL | NULL |
| ZZZ SECURITY TEST - DELETE ME | pending_review | 2026-09-18 | no | `excluded` | NULL | NULL |

Active/approved: 1. Excluded: 2. Unmapped: 1. Mapped to project: 0. Mapped to unit: 0.

**Old model vs new model**

| Old (`properties`) | New (canonical) |
|---|---|
| One row is project *and* unit at once | `projects` = identity; `inventory_units` = configuration |
| `builder_id` → a brand name | `developers` → a legal promoter with its own registration evidence |
| `rera_number` free text, unvalidated | `rera_project_reg_no` + verification timestamp + named verifier |
| Availability implied by presence | Availability derived from dated claims, with staleness |
| `source_broker_id` conflates entry with sourcing | `project_sources` separates the two, with no entitlement columns |
| Approve/reject flag | Lifecycle: draft → pending_verification → verified → published → suspended/rejected/archived |

```
LEGACY PROPERTY (3 rows)
      ↓  analysis                      [done — Stage 1B audits]
      ↓  project identification        [Lodha: registration confirmed, tower scope open]
      ↓  developer identification      [MACROTECH DEVELOPERS LIMITED, primary source]
      ↓  source evidence               [MISSING — no sourcing account recorded]
      ↓  inventory identification      [BLOCKED — no unit identity, area basis unknown]
      ↓  manual mapping                [NOT DONE — project_id/inventory_unit_id still NULL]
      ↓
CANONICAL SYSTEM
```

No automatic backfill is proposed anywhere, and every migration states this explicitly.

---

## PART 9 — STAGE 0 EXPLAINED

Two migrations, both applied to the live database.

**`20260921090000_broker_property_scope_stage0.sql`**
- Dropped `properties_broker_insert_own` and `properties_broker_update_own_pending` — unused broker write paths.
- Replaced `properties_broker_read_all` (which had no status filter, so brokers could read pending, rejected and soft-deleted rows) with `properties_broker_read_approved`, limited to approved and non-deleted rows.
- **Deliberately unchanged:** `properties_public_read_approved`, `properties_broker_read_own`, `properties_admin_full_access`, and the immutability trigger. No property row was modified.

**`20260921091000_audit_provenance_and_pii_minimisation.sql`**
- Added `audit_log.actor_type` (`authenticated_user` / `public_form` / `service_role` / `system`), because 38 of 47 audit rows had a NULL actor and "unattributed" was ambiguous.
- Rewrote `log_audit_event()` to record provenance and to pass payloads through `redact_audit_pii()`, so buyer names, phones, emails and free text no longer land verbatim in an append-only table.
- **Deliberately unchanged:** existing audit rows are not retro-redacted; `audit_log` still has no UPDATE or DELETE policy for anyone.

**Unresolved issues carried forward:** the `/api/leads` rate limiter is in-memory and per-instance; `lib/.env.local` was tracked in git _(corrected: untracked by commit `c7e5ce8c`)_; historical audit rows still contain PII.

---

## PART 10 — STAGE 1 EXPLAINED

All J1–J9 are applied to the live database (confirmed by the tables existing with the expected reference rows). Risk column describes residual risk after application.

| J# | File | Purpose | Created | Did NOT change | Live | Verified | Depends on | Risk |
|---|---|---|---|---|---|---|---|---|
| J1 | `…090000_j1_reference_tables` | Tunable business policy in rows | `source_party_precedence`, `inventory_freshness_policies`, RLS, triggers | Nothing existing | Yes | Rows present (4+3) | — | Low |
| J2 | `…090100_j2_seed_reference_rows` | Seed 7 reference rows | 4 precedence + 3 freshness rows | No business data; explicitly no backfill | Yes | Counts match | J1 | Low |
| J3 | `…090200_j3_developers_source_parties` | Promoter + party identity | `developers`, `source_parties` | `builders` untouched | Yes, empty | Exists, 0 rows | J1 | Low |
| J4 | `…090300_j4_projects` | Canonical project identity | `projects`, publication invariant | `properties` untouched | Yes, empty | Exists, 0 rows | J3 | Low |
| J5 | `…090400_j5_sources_units_claims` | Provenance, units, claims | 3 tables, 4 integrity triggers | No auto-conversion of `source_broker_id` | Yes, empty | Exists, 0 rows | J4 | Low |
| J6 | `…090500_j6_duplicate_candidates` | Duplicate review queue | `project_duplicate_candidates`, `detect_project_duplicates()` | Never merges anything | Yes, empty | Exists, 0 rows | J4 | Low |
| J7 | `…090600_j7_redact_display_name` | Extend PII redaction | Replaced `redact_audit_pii()` body | Triggers unchanged | Yes | Function replaced | Stage 0 | Low |
| J8 | `…090700_j8_inventory_effective_view` | Derived availability | `inventory_units_effective` view | Stores no state | Yes | View returns 0 rows | J5, J1 | Low |
| J9 | `…090800_j9_properties_linkage` | Link legacy to canonical | 3 columns + 3 indexes on `properties` | No RLS change, no row rewritten | Yes | Columns present, all NULL/`unmapped` | J4, J5 | Low |
| J10 | `supabase/verification/…090900_j10_verification_readonly` _(relocated 2026-09-24)_ | Read-only verification script | Nothing | Nothing | N/A | Reported passing by owner; output NOT VERIFIED in this audit | J1–J9 | None |

**Design philosophy**
- **Additive:** nothing renamed, dropped or repointed; all four foreign keys into `properties.id` still resolve.
- **Evidence-driven:** verified states require a timestamp *and* a named human.
- **No automatic entitlement:** provenance tables physically cannot express commission.
- **No anonymous access:** locked decision 8 — no anon policy on any Stage 1 table, confirmed by probe.
- **Manual review:** detection may be automated; merging never is.
- **Append-only where it matters:** claims and audit rows are never updated or deleted.
- **Existing data preserved:** no backfill, no row modified, soft delete only.

---

## PART 11 — STAGE 1B EXPLAINED

**Legacy analysis (read-only, 2026-09-22):** 3 rows examined with explicit column lists, along with their builders, source broker, audit history and every foreign-key reference.

**Excluded test records (2).** `ZZZ SECURITY TEST - DELETE ME` and `TEST APPROVAL DELETE ME` are now `migration_state='excluded'`, verified live. They were excluded because each is soft-deleted, never approved (one `pending_review`, one `rejected`), priced at 1, carries a placeholder RERA value (`TEST-RERA-DELETE`, `TEST-RERA-001`), says "DELETE" in its own title and description, and has zero lead, visit, deal or ledger references. `excluded` means never migrated — the rows still exist.

**Lodha World Towers remains `unmapped`** because it mixes project-level and unit-level data in one row, the canonical tables are empty, and the tower/tier scope is unresolved (see Part 12).

**Why `source_broker_id` is not converted:** see Part 7. It is forbidden by the J5 locked decision, and the evidence on this specific row is weak.

**Why unit creation is blocked:** no unit label, tower or floor; the area "2250 sq.ft" does not say carpet or built-up, and the schema has separate columns for each; the price has no basis or date; and an availability claim needs a real claimant party, of which none exists.

**Evidence still missing:** registration date and certificate PDF; extension status; registered address; which tower/tier the listing describes; the sourcing account; the area basis; price currency-of-information; image provenance and usage rights.

---

## PART 12 — LODHA WORLD TOWERS CASE

**Legacy property:** `d449dbf9-192d-47ef-9ab9-ee2f3c3c12cb`, "Lodha World Towers", slug `lodha-world-towers-lower-parel`, Mumbai / Lower Parel, Apartment, 4 BHK, 4 bath, 2250 sq ft, ₹8.5 Cr, `ready_to_move`, approved, featured, live, builder `Lodha`, `rera_number = P51900008345`, `migration_state='unmapped'`, both linkage columns NULL, 3 soft-deleted leads attached, 0 visits/deals/ledger rows.

### PRIMARY EVIDENCE (MahaRERA, retrieved 2026-09-22)
- Registered project name: **`THE WORLD TOWERS - WORLD ONE - TIER II`**.
- Promoter: **`MACROTECH DEVELOPERS LIMITED`**.
- Location components: Mumbai City district, Ward GSouth, pincode 400013, Konkan division.
- **The number appears in MahaRERA's official "List of Lapsed Projects", with proposed completion `30-09-2019`.** Raw CSV downloaded and searched locally.
- It is **not** on the "List of Projects Deregistered", and **not** on the "Due to Lapse of Completion Date" abeyance list (so the abeyance/frozen-accounts statement does not apply).
- The name itself names the tower and tier, so the registration covers **World One Tier II only**.
EVIDENCE: `maharera.maharashtra.gov.in/projects-search-result?certificate_no=P51900008345`; `…/lapsed-projects-detail`; `…/export-lapsed-data/total` row 541; `…/list_of_projects_deregistered`; `…/index.php/due-lapse-completion-date`.

### SECONDARY EVIDENCE (not treated as fact)
Third-party listing sites stating a possession date of 30/09/2018 — this disagrees with the primary 30-09-2019. Lodha's own site associating the number with "Lodha World Towers". General knowledge that Macrotech is the Lodha group entity.

### UNKNOWN / NOT VERIFIED
Registration date; the certificate PDF (detail page id **10063** is JavaScript-only and returned nothing); whether an extension was granted; the registered street address; the legal meaning and current effect of "lapsed"; whether a standalone promoter registration number exists; **and above all, whether this listing is actually a unit in World One Tier II rather than another tower or tier.**

### Status answers
- Project verified? **No** — no `projects` row exists at all.
- Project published? **No.**
- Property mapped? **No** — `project_id` NULL.
- Unit mapped? **No** — `inventory_unit_id` NULL.

### Why no automatic mapping should occur
The registered name describes one tower and tier while the listing is titled after the whole complex; the listing says `ready_to_move` while the registration's completion date has lapsed; the developer is a brand name in the legacy row and a legal entity in the register; and the sourcing account is unrecorded. Any automatic mapping would convert three unresolved questions into recorded facts.

---

## PART 13 — RERA / COMPLIANCE ARCHITECTURE

### Current code enforcement (repo only, not deployed)
- `lib/compliance/rera.ts`: the agent registration number comes from `NEXT_PUBLIC_MAHARERA_AGENT_REG_NO` and is never hardcoded; `reraVerification()` always reports `humanVerified: false`; `describeProjectRegistration()` renders only "as provided for this project"; `PROHIBITED_UNSUPPORTED_CLAIMS` lists phrases such as "RERA verified", "clear title" and "guaranteed return", with `findProhibitedClaims()` to scan copy.
- `components/ReraDisclosure.tsx`: renders the agent line, the project line and the MahaRERA website, or nothing at all. It makes no verification claim.
- `lib/compliance/publicMode.ts`: pre-registration mode is on whenever no agent number is configured; the override can only tighten, never loosen. `/properties` shows a holding notice, detail pages 404, the sitemap omits properties, and the homepage shows no inventory.
- Unresolved interpretation questions are recorded as TODOs in code (quadrant placement, QR obligation, media scope, no programmatic verification route) rather than being guessed.

### Database enforcement
- A project cannot be `verified` or `published` without a registration number, a verification timestamp and a named verifier.
- A developer cannot be `verified` without a timestamp and verifier.
- No format or regex validation on any RERA field — deliberately, since the valid format is unconfirmed.
- `rera_reg_expires_at` is a date, not a boolean, so lapses are detectable.

### Business policy
Precedence ranks and freshness windows are rows an admin can change. Publication is a commercial decision separate from verification.

### Legal questions — needs human legal review
The four TODOs above; the meaning and consequences of "lapsed" for `P51900008345`; whether an agent may advertise a lapsed project; and whether the live site's current content is compliant.

### ⚠ The live site does not have any of this
Production still serves `50+` / `Projects Curated` on `/about`, `RERA Registered · Verified Projects Only` site-wide, three placeholder listings as if they were inventory, and **no MahaRERA agent disclosure at all**. These are the exact violations `CLAUDE.md` marks as Critical, and they are live right now.
EVIDENCE: production `curl` probes, 2026-09-22.

---

## PART 14 — PUBLIC WEBSITE DATA FLOW

All flows below describe the **repo build**. The deployed build differs (Finding 1).

1. **Homepage** — visit `/` → `app/page.tsx` (Server Component) → `publicPropertySurfacesEnabled()`; if enabled, `supabase.from("properties").select(...).eq("is_featured",true).eq("approval_status","approved").is("deleted_at",null)` → `Navbar`, `Hero`, `FeaturedProjects`, `WhyPinnacl`, `EnquirySection`, `Footer`. Currently the inventory block is skipped entirely.
2. **Properties list** — `/properties` → `app/properties/page.tsx`; in pre-registration mode it returns the holding notice. Otherwise → `PropertiesClient` → `PropertiesList` → browser-side Supabase query with filters synced to the URL → `PropertyCardLux`.
3. **Property detail** — `/properties/[slug]` → 404 in pre-registration mode; otherwise a single Supabase row by slug → `PropertyDetails` + `RealEstateListing` JSON-LD (escaped before `dangerouslySetInnerHTML`).
4. **Enquiry form** — form in `EnquirySection` / `/contact` / `PropertyDetails` → `POST /api/leads` → rate limit (5 per 10 min, in-memory) → validation → Supabase `leads` insert (anon policy) → Google Sheets append (RAW mode) → Resend email to the owner → `{ok:true}`.
5. **Contact** — `/contact` renders its own form, same endpoint.
6. **WhatsApp CTA** — `Hero` floating button → `wa.me/919146238303`. No server involvement. `PropertyDetails.tsx` still contains `wa.me/91XXXXXXXXXX`.
7. **SEO/sitemap** — `app/sitemap.ts` lists 5 static routes plus one entry per approved property, skipped entirely in pre-registration mode; `app/robots.ts` allows all and disallows `/api/`; `app/layout.tsx` emits Organization + WebSite JSON-LD.
8. **Pre-registration mode** — `lib/compliance/publicMode.ts` is consulted by `app/page.tsx`, `app/properties/page.tsx`, `app/properties/[slug]/page.tsx`, `app/sitemap.ts`, `app/locations/[location]/page.tsx`, `Navbar.tsx` and `Footer.tsx` (which hide the link rather than linking to a holding page).

---

## PART 15 — ADMIN FLOW

`/broker/login` (shared sign-in) → role check → admin lands on `/admin/brokers`.

| Module | Route | Real or shell |
|---|---|---|
| Broker approval | `/admin/brokers` | **Functional** — create invites, approve/reject, list pending and existing brokers |
| Property CMS | `/admin/properties` | **Functional** — list, search, filter, create, edit, drag-and-drop image upload straight to Storage, builder dropdown with get-or-create, featured toggle, soft delete with confirm |
| Approval workflow | inside the CMS | **Functional** — `approval_status` is validated server-side (`pending_review`/`approved`/`rejected`) |
| Lead CRM | `/admin/leads` | **Functional** — list, filter by stage, create a lead, assign a broker, change status, read and add notes |
| Pipeline | inside `/admin/leads` | **Partial** — stage filtering over the 7 statuses; no board view, no automation |
| Dashboard / reporting | — | **Does not exist** |
| Deals, commissions, site visits | — | **Does not exist** — no UI, no API, no code reference |

Every admin route and API re-checks `profile.role === 'super_admin'` and returns 403 rather than relying on the UI.

---

## PART 16 — BROKER FLOW

**Authentication:** invite only. Admin creates an invite → the link is shared manually → the broker sets a password at `/broker/accept-invite` → the account is created with `status='pending_approval'` → the admin approves at `/admin/brokers` → only then can the dashboard be reached. There is no public signup anywhere.

**Access rules today:** `/broker/dashboard` is a gated placeholder that shows pending, rejected or active states. `/broker/properties` and `/broker/properties/[id]` are read-only, filtered to approved, non-deleted listings, with search, filters and an image carousel. `/broker/leads` shows leads assigned to that broker, with notes.

**Own-source visibility:** the `properties_broker_read_own` policy still lets a broker read their own source rows at any status, but no UI uses it.

**Pending property restrictions:** since Stage 0, brokers cannot see pending or rejected inventory, and have no insert or update path at all.

**Broker submission status:** not built. **Not yet built:** self-upload, availability claims, collaboration, deals, commissions, earnings.

```
BROKER (exists: auth, approval, read-only catalogue, assigned leads)
   ↓
SOURCE / PROPERTY ......... FUTURE (submission workflow, Stage 3)
   ↓
PROJECT / INVENTORY ....... FUTURE (tables exist, empty)
   ↓
AVAILABILITY CLAIM ........ FUTURE (table + triggers exist, empty)
   ↓
LEAD / COLLABORATION ...... PARTIAL (leads exist; collaboration has no table)
   ↓
DEAL ...................... FUTURE (schema only)
   ↓
COMMISSION ................ FUTURE (schema only)
```

---

## PART 17 — LEAD / CRM ARCHITECTURE

```
PUBLIC ENQUIRY (4 form implementations)
   ↓
POST /api/leads  ── rate limit → validate → HTML-escape
   ↓                     ↓                    ↓
SUPABASE leads      GOOGLE SHEETS         RESEND EMAIL
(anon insert)       (RAW append)          (owner notification)
   ↓
ADMIN CRM (/admin/leads) and BROKER CRM (/broker/leads)
```

**Architectural concerns, all verified:**
1. **Three parallel destinations.** Every enquiry lands in Supabase, a Google Sheet and an email inbox. The Sheet and inbox have no ownership, status or audit model, so they drift from the CRM the moment anyone edits a lead.
2. **Four separate form implementations** with no shared component or validation.
3. **No lead source or attribution field.** Nothing records which channel, page or party produced a lead — a gap that matters directly for future collaboration and commission.
4. **Ownership is unused.** All 15 leads have `assigned_broker_id = NULL`, and all 15 are soft-deleted. 12 have no property.
5. **Anyone can write to `leads` directly.** The `leads_public_insert` policy is `with check (true)` for `anon`, so the API's rate limiter can be bypassed entirely by calling PostgREST with the public key. **OPEN RISK.**
6. **The rate limiter is per-instance and in-memory**, so it does not hold across serverless instances.
7. **The Sheets/email path depends on a service-account key file on disk**, which is fragile on serverless hosting; live behaviour is NOT VERIFIED.

---

## PART 18 — TRANSACTION + COMMISSION ARCHITECTURE

**Current reality:** `site_visits`, `deals` and `commission_ledger` exist with full schemas, constraints, indexes, RLS and audit triggers — and **zero rows and zero application references**. `deals` RLS was hardened on 2026-09-18 so a broker can only self-insert a deal where they are both source and closing broker, plus a new admin insert policy. That was a pre-emptive fix to schema, not a sign the feature exists.

**Intended future (none of this exists):**
```
DEAL → DEAL PARTICIPANTS → COLLABORATIONS → COMMISSION AGREEMENTS
     → COMMISSION ALLOCATIONS → COMMISSION EVENTS → PAYMENT RECORDS
     → DISPUTES → DOCUMENTS → AUDIT
```
Today's `deals` supports exactly two brokers, and `commission_ledger` has a fixed four-way split that must reconcile. The richer model above needs tables that do not exist.

**Why entitlement must be transaction-specific and evidence-backed:** a share must come from an agreement attached to one transaction, supported by closing proof, and verified by a person — never inferred from an identity field on a listing. The schema already reflects this: provenance carries no commercial columns, the ledger requires shares to sum to the gross, and `closing_proof_url` exists precisely so proof precedes release.

---

## PART 19 — INVENTORY ARCHITECTURE

```
PROJECT ──▶ UNIT ──▶ CLAIMS (append-only) ──▶ WINNING CLAIM ──▶ EFFECTIVE AVAILABILITY ──▶ PUBLISHABLE?
```

- **Precedence:** developer (1) > pinnacl (2) > broker (3) > referrer (4). Lower rank wins. These are rows, tunable without a deploy.
- **Snapshot vs live rank:** each claim stores the rank that was correct when it was made, and the trigger refuses any value that does not match live reference data, so precedence cannot be forged. The view shows both the snapshot and the live rank that decided the winner.
- **Freshness:** `actively_marketed` 7 days, `standard` 14, `long_cycle` 30. Past the window the effective state becomes `stale`.
- **Conflict detection:** `has_conflicting_claim` is true when a lower-precedence party made a more recent, contradicting claim. The higher-precedence claim still wins, but the disagreement is visible instead of discarded.
- **Manual evidence:** every claim can carry an `evidence_ref` and a `recorded_by`.
- **Why availability is never a stored field:** a stored flag is how listings stay "available" forever. Deriving it means an unconfirmed unit decays to `stale` on its own.

**Current implementation:** all of the above exists and works structurally; the view returns 0 rows because there are no units or claims. **Future business use:** broker and developer confirmations, publication gating, and buyer-facing accuracy.

---

## PART 20 — DUPLICATE DETECTION

- `project_duplicate_candidates` stores pairs with `confidence`, `signals`, `detection_method`, `review_state` (`open`/`merged`/`distinct`/`dismissed`), reviewer and resolution note. A check constraint enforces canonical ordering so a pair cannot be stored twice.
- Two signals only: **`rera_exact`** (same non-null registration number, confidence 0.95) and **`name_city`** (same normalised name and city, confidence 0.75). Name alone is deliberately not a signal.
- **No `pg_trgm` in Stage 1** — similarity matching may come later as its own migration.
- **Detection is automated; merging never is.** `detect_project_duplicates()` only inserts candidates in state `open`, runs as the invoking user with an explicit `is_super_admin()` guard, and refuses callers with no signed-in user.
- A merge sets `projects.merged_into_id` and archives the loser; it never deletes a row or rewrites foreign keys, which is what makes it reversible.
- Candidates are internal review data: the table is admin-only, has no anon policy, and is excluded from any public surface.

**Relevant to Lodha:** sibling registrations of the same complex will look similar by name. They are genuinely distinct projects and must be reviewed as `distinct`, not merged.

---

## PART 21 — SECURITY ARCHITECTURE

### GOOD / VERIFIED
- RLS is enabled on every table inspected, and Stage 1 tables return 0 rows to anonymous callers — including seeded reference tables, which proves filtering rather than emptiness.
- Role checks are duplicated in application code and RLS; admin APIs return 403 independently of the UI.
- The service-role key is used in exactly one route and guarded by `server-only`.
- `SECURITY DEFINER` functions all set `search_path = public`.
- Self-escalation of `role`, `status` and `kyc_status` is blocked by trigger (AUD-01, verified live by the owner).
- `deals` INSERT policies tightened and verified live (2026-09-18).
- Audit logging records provenance and redacts known personal-data keys; `audit_log` has no UPDATE or DELETE policy for anyone.
- Soft delete everywhere; claims and visits are append-only; provenance fields are immutable by trigger.
- Security headers and a real CSP are configured, with the `unsafe-inline` trade-off documented rather than hidden.
- `/api/leads` validates input, HTML-escapes before email, and uses RAW mode for Sheets to prevent formula injection.
- Admin/broker API errors return a generic message and log details server-side only.

### KNOWN LIMITATION
- The `/api/leads` rate limiter is in-memory and per-instance.
- `lib/supabase/types.ts` is hand-written and now out of date.
- CSP relies on `'unsafe-inline'` for scripts and styles.
- Live policy and trigger state cannot be verified from this environment; most claims rest on migration files.

### OPEN RISK
1. **`invites` is readable by anonymous callers, tokens included** (Finding 2). The one existing token belongs to an already-accepted, expired invite, so it cannot be redeemed; but any future pending invite would be readable by anyone holding the public key, and the invitee's email address leaks today. Root cause NOT VERIFIED.
2. **Anyone can insert into `leads` with the public key**, bypassing the API's validation and rate limiting entirely.
3. **Anonymous callers can read `properties.migration_state`, `project_id` and `inventory_unit_id`** on approved rows; the app never selects them.
4. **Production runs a stale build** with no compliance gate and unsupported public claims (Finding 1).
5. **No spam protection** beyond the rate limiter — no honeypot, no CAPTCHA.

### FUTURE HARDENING
Shared Supabase-backed rate limiting; a honeypot field; nonce-based CSP; regenerated types; retro-redaction of historical audit PII (an explicit, separate decision since `audit_log` is append-only).

**This system is not "fully secure", and this audit does not claim it is.** It is a point-in-time review with two confirmed open issues and several unverifiable areas.

---

## PART 22 — APPLICATION ↔ DATABASE DEPENDENCY MAP

"If I change table X, what could break?"

| Table | Files using it | API routes | UI routes | Used? |
|---|---|---|---|---|
| `properties` | `app/page.tsx`, `app/properties/page.tsx`, `app/properties/[slug]/page.tsx`, `app/sitemap.ts`, `components/PropertiesList.tsx`, `app/admin/properties/page.tsx`, `app/broker/properties/page.tsx`, `app/broker/properties/[id]/page.tsx`, `app/admin/leads/page.tsx`, `app/api/leads/route.ts` | `/api/admin/properties`, `/api/admin/properties/[id]`, `/api/broker/properties` | `/`, `/properties`, `/properties/[slug]`, `/admin/properties`, `/broker/properties`, `/admin/leads` | **YES — highest blast radius** |
| `builders` | `app/admin/properties/page.tsx` | `/api/admin/properties`, `/api/admin/properties/[id]` | `/admin/properties` | YES (dropdown + get-or-create) |
| `profiles` | `lib/supabase/getSessionProfile.ts`, `app/admin/brokers/page.tsx`, `app/admin/leads/page.tsx`, `app/broker/login/page.tsx`, `app/api/broker/accept-invite/route.ts` | `/api/admin/brokers/[id]`, `/api/broker/accept-invite` | every gated route | **YES — auth depends on it** |
| `leads` | `app/admin/leads/page.tsx`, `app/broker/leads/page.tsx`, `app/broker/leads/[id]/page.tsx`, `app/api/leads/route.ts` | `/api/leads`, `/api/admin/leads*`, `/api/broker/leads*` | `/admin/leads`, `/broker/leads` | YES |
| `lead_notes` | `app/broker/leads/[id]/page.tsx` | `/api/admin/leads/[id]/notes`, `/api/broker/leads/[id]/notes` | `/admin/leads`, `/broker/leads/[id]` | YES (empty) |
| `invites` | `app/admin/brokers/page.tsx`, `app/api/broker/accept-invite/route.ts` | `/api/admin/invites`, `/api/broker/accept-invite` | `/admin/brokers`, `/broker/accept-invite` | YES |
| Storage `property-images` | `lib/supabase/propertyImages.ts` | — | `/admin/properties` | YES |
| Storage `properties` (legacy) | `lib/supabase/propertyImageUrl.ts` | — | public + broker image rendering | YES — holds the Lodha images |
| `audit_log` | none | none | none | Written by triggers only |
| `site_visits`, `deals`, `commission_ledger` | **none** | none | none | **NO — schema only** |
| `projects`, `developers`, `source_parties`, `project_sources`, `inventory_units`, `unit_availability_claims`, `project_duplicate_candidates`, `source_party_precedence`, `inventory_freshness_policies`, `inventory_units_effective` | **none** | none | none | **NO — future only** |

**Practical consequences.** Changing any Stage 1 table today cannot break application code, because none is referenced. Changing `properties` columns can break up to ten files at once. `GET /api/admin/properties/[id]` uses `select("*")`, so it silently returns any new column. Every other query uses explicit column lists, so added columns are invisible to them but **renamed or dropped columns would break them immediately**.

---

## PART 23 — PRODUCTION VS REPO VS PLAN

### A. Production live (public domain)
Old marketing build; `/`, `/about`, `/contact`, `/projects` (renders), `/properties` and detail pages serving three placeholder listings from JSON; `GET /api/properties`; `POST /api/leads` (version NOT VERIFIED); sitemap with placeholder slugs; footer RERA claim and `/about` scale claims. `/broker/login` and `/admin/*` return 500.

### B. Repo present, not live
Supabase-backed public pages; pre-registration compliance mode and `ReraDisclosure`; broker/admin authentication and `proxy.ts`; property CMS; lead CRM; `/projects` redirect; removal of `/api/properties`; hardened `/api/leads`; security headers and CSP; `lib/api/serverErrorResponse.ts`; `lib/supabase/*`. **65 uncommitted working-tree entries** (34 modified, 7 deleted, 24 untracked) on `stable`, whose HEAD is `d4669b58`.

### C. Future / planned
Canonical project and inventory usage; broker self-upload; availability claims; duplicate review UI; site visits; deals; commissions; payments; disputes; collaboration; reporting; "Pinnacl Pro" B2B SaaS.

### Migrations

| Migration | State |
|---|---|
| `20260816120000_core_tables` | APPLIED (tables exist with data) |
| `20260816120100_transaction_and_audit_tables` | APPLIED |
| `20260816120200_row_level_security` | APPLIED (behaviour confirmed, except `invites` — Finding 2) |
| `20260817090000_broker_auth_invites` | APPLIED (table and rows exist; **its RLS intent is not in effect**) |
| `20260818100000_property_listings_module` | APPLIED |
| `20260819100000_lead_management_crm` | APPLIED (`lead_notes` exists, 7 statuses in use) |
| `20260918090000_property_images_bucket_hardening` | APPLIED — NOT VERIFIED (bucket limits unreadable from here) |
| `20260918100000_deals_rls_hardening` | APPLIED and verified live by the owner, 2026-09-18 |
| `20260919090000_profiles_status_kyc_admin_only` | APPLIED and verified live by the owner, 2026-09-19 |
| `20260921090000_broker_property_scope_stage0` | APPLIED — NOT VERIFIED directly |
| `20260921091000_audit_provenance_and_pii_minimisation` | APPLIED (`actor_type` column present in query results) |
| `20260922090000` … `20260922090800` (J1–J9) | APPLIED (tables, reference rows and J9 columns all present) |
| `20260922090900_j10_verification_readonly` | **VERIFICATION-ONLY — not a migration, must never be applied as one.** _Corrected: moved out of `supabase/migrations/` into `supabase/verification/` on 2026-09-24, so it cannot be applied or repaired into migration history._ |

---

## PART 24 — CURRENT SYSTEM DIAGRAM

```
                               PINNACL PROPERTIES
                                       │
        ┌──────────────────────────────┴──────────────────────────────┐
        │                                                             │
   PUBLIC PRODUCT                                            ADMIN / BROKER
   (deployed: OLD build)                                     (NOT deployed → 500)
        │                                                             │
   Next.js 16 App Router                                   Supabase Auth + proxy.ts
   / /about /contact                                       /broker/login
   /properties /properties/:slug                           /broker/accept-invite
   /projects→/properties  /locations/:loc                  /broker/dashboard (shell)
   sitemap.xml  robots.txt                                 /broker/properties (read-only)
        │                                                  /broker/leads
   pre-registration gate (repo only)                       /admin/brokers
        │                                                  /admin/properties (full CRUD)
   POST /api/leads                                         /admin/leads (CRM)
        │                                                             │
        ├──▶ Google Sheets                          /api/admin/*  ·  /api/broker/*
        ├──▶ Resend email                                            │
        └──────────────┬──────────────────────────────────────────────┘
                       ▼
                    SUPABASE (live, current)
                    Postgres · RLS · Auth · Storage · audit triggers
                       │
   ┌──────────┬────────┴────────┬──────────────┬─────────────────┬──────────────┐
   ▼          ▼                 ▼              ▼                 ▼              ▼
 leads(15)  properties(3)   profiles(2)    invites(1)        audit_log(56)   builders(4)
 lead_notes  ├ 1 unmapped                  ⚠ anon-readable
   (0)       └ 2 excluded
                       │
                       │  J9 linkage columns (both NULL)
                       ▼
        ┌──────────────────────────────────────────────────────┐
        │  STAGE 1 CANONICAL LAYER — exists, empty, admin-only │
        │  developers(0) · source_parties(0) · projects(0)     │
        │  project_sources(0) · inventory_units(0)             │
        │  unit_availability_claims(0) · duplicates(0)         │
        │  reference: precedence(4) · freshness(3)             │
        │  view: inventory_units_effective(0)                  │
        └───────────────────────┬──────────────────────────────┘
                                ▼
        ┌──────────────────────────────────────────────────────┐
        │  TRANSACTION LAYER — schema only, zero code refs     │
        │  site_visits(0) · deals(0) · commission_ledger(0)    │
        └───────────────────────┬──────────────────────────────┘
                                ▼
                   REPORTING — does not exist
```

---

## PART 25 — INTENDED FUTURE ARCHITECTURE

**CURRENT:** a marketing site plus a private CMS and CRM, with an empty canonical skeleton underneath and a stale production deployment.

**→ STAGE 1B:** decide the legacy rows one at a time. Two test rows are already excluded. Lodha waits on evidence. Create `developers` and `projects` rows only when the evidence supports them, at `unverified`/`draft`.

**→ NEXT STAGE:** deploy the current codebase; obtain the agent registration and turn off pre-registration mode; give admin a UI for projects, developers and sources; enable broker submission with review; start recording availability claims.

**→ FUTURE PLATFORM:** collaboration between brokers, site visits, deals, commission agreements and allocations, payment records, disputes, documents, and reporting over the audit trail.

```
WEBSITE → LEADS → CRM → PROJECT NETWORK → INVENTORY NETWORK →
BROKER COLLABORATION → SITE VISIT → DEAL → COMMISSION → PAYMENT RECORD → AUDIT / REPORTING
```

**Revenue-producing:** leads, the CRM, deals and commissions. Optionally, later, subscriptions to "Pinnacl Pro".
**Infrastructure:** the project and inventory networks, provenance, audit, compliance and duplicate review. These do not earn money directly; they are what makes the revenue parts defensible and disputes resolvable.

---

## PART 26 — BUSINESS OPERATING SYSTEM

| Step | Who | What | System today | Data | Decision | Evidence | Automation | Manual control |
|---|---|---|---|---|---|---|---|---|
| Lead generation | Visitor | Submits enquiry | Website + `/api/leads` | `leads` | — | Form submission | Capture, notify | Choosing what is advertised |
| Qualification | Owner/broker | Decide if genuine | `/admin/leads` status | `leads.status` | Human | Notes | Stage filter only | Full |
| Assignment | Owner | Give lead to a broker | `/admin/leads` | `assigned_broker_id` | Human | — | None | Full |
| Property matching | Broker | Match buyer to stock | `/broker/properties` | `properties` | Human | — | Search/filter | Full |
| Inventory verification | Broker/developer | Confirm still available | FUTURE (claims) | `unit_availability_claims` | Human | `evidence_ref` | Staleness, conflict flags | Confirmation itself |
| Site visit | Broker | Take buyer to site | FUTURE (`site_visits`) | `site_visits` | Human | Visit record | Logging | Full |
| Negotiation | Broker/owner | Price and terms | Not modelled | — | Human | Notes | None | Full |
| Collaboration | Two brokers | Work a deal together | FUTURE (no table) | — | Human | Agreement | None | Full |
| Closing | Owner | Confirm the deal | FUTURE (`deals`) | `deals` | Human | `closing_proof_url` | None | Full |
| Commission | Owner | Split and release | FUTURE (`commission_ledger`) | ledger | Human | Agreement + proof | Arithmetic only | Full |
| Post-sale | Owner | Handover, service | Not modelled | — | Human | — | None | Full |
| Referral / repeat | Owner | Re-engage | Not modelled | — | Human | — | None | Full |

**Human judgement must remain** at: verification of any registration, project publication, lead assignment, availability confirmation, duplicate merges, deal verification, and every commission decision.

---

## PART 27 — AUTOMATION / AI BOUNDARIES

**MAY (and in some cases already does):** flag possible duplicates for review; compute staleness from claim age and policy; surface conflicting claims; route or suggest lead assignment; notify on new enquiries; refresh derived views; generate reports and summaries; draft copy for a human to approve; scan copy for prohibited claims via `findProhibitedClaims()`; run read-only audits like this one.

**MUST NOT decide automatically:** whether a RERA registration is valid or covers a property; whether a project may be verified or published; whether two projects are the same project; whether a party is a legitimate source; whether a unit is available; who is entitled to commission and in what share; any dispute; attribution where evidence is ambiguous; ownership rights; and any deletion of records.

The architecture already enforces much of this: verified states require a named human; detection inserts candidates but never merges; precedence cannot be forged; provenance carries no commercial columns; and nothing is ever hard-deleted.

---

## PART 28 — RISK REGISTER

No numeric scores are used, since the repo defines none.

| Risk | Cause | Current control | Impact | Likelihood | Status | Recommended next control |
|---|---|---|---|---|---|---|
| Stale inventory shown as available | Availability treated as permanent | Claims + freshness + `stale` state | Buyer misled | Low now (no units) | Controlled by design | Enforce freshness at publication |
| Wrong or unverified RERA number published | Free-text field, no validation | Publication invariant; `humanVerified:false`; pre-registration mode | Regulatory and reputational | **Live on production today** | **OPEN** | Deploy the current build |
| Duplicate projects | Multiple sources, similar names | `rera_exact` + `name_city` detection, manual merge | Data integrity | Medium later | Controlled | Add similarity matching later |
| Duplicate buyers/leads | No dedupe at all | None | Attribution disputes | Medium | OPEN | Define buyer identity |
| Source disputes | Ambiguous provenance | `project_sources` with immutable evidence | Trust | Medium later | Controlled by design | Require evidence before acceptance |
| Broker disputes | Unclear attribution | Two-party model; own-data RLS | Trust, money | Medium later | Partly controlled | Build participants model |
| Commission disputes | Entitlement inferred from a field | No entitlement columns in provenance | Money, legal | Medium later | Controlled by design | Explicit written agreements |
| Accidental public publication | A listing goes live unreviewed | `approval_status` + `deleted_at` + pre-registration gate | Compliance | **Already happened on production** | **OPEN** | Redeploy; keep the gate |
| RLS failure | Policy missing or disabled | Policies per table; anon probes | Data exposure | **Confirmed for `invites`** | **OPEN** | Diagnose `pg_policies` for `invites` |
| Anonymous writes to `leads` | `with check (true)` | API-side limits only, bypassable | Spam, junk data | Medium | OPEN | Tighten policy or add a gateway |
| API/schema mismatch | Renamed or dropped columns | Explicit column lists | Runtime errors | Low | Controlled | Regenerate types |
| Type mismatch | Hand-written `types.ts` | Compiles today | Build breakage | Medium | Known limitation | Regenerate once CLI exists |
| Legacy data corruption | Manual production SQL | Soft delete, immutability triggers, audit | Data loss | Low | Controlled | Keep writes in the app |
| Bad migration | Manual SQL Editor application | Re-runnable migrations, J10 verification | Outage | Low | Controlled | Keep the verify-after-apply habit |
| Unauthorized edits | Self-escalation | AUD-01 trigger, verified live | Privilege escalation | Low | Controlled | Periodic re-verification |
| Audit gaps | SQL Editor has no actor | `actor_type='system'` | Traceability | Medium | Known limitation | Prefer app paths for writes |
| Rate limiting bypass | In-memory, per instance | Partial | Abuse | Medium | Known limitation | Shared store |
| Spam | No honeypot or CAPTCHA | Validation only | Junk leads | Medium | OPEN | Honeypot field |
| External API failure | Sheets/Resend/key file | Supabase insert isolated in try/catch | Lost notifications | Medium | Partly controlled | Retry or queue |
| **Stale production deployment** | Never redeployed | None | Users see old, non-compliant site | **Certain — it is live** | **OPEN** | Deploy deliberately, with env vars set |

---

## PART 29 — KNOWN TECHNICAL DEBT

**MUST FIX**
- `invites` readable by anonymous callers, tokens included (Finding 2).
- Production runs a stale build with unsupported public claims and placeholder inventory (Finding 1).
- `leads` accepts anonymous inserts directly, bypassing all API protection.
- 65 uncommitted working-tree entries, including every Stage 0/1 migration and the compliance layer.

**SHOULD FIX**
- `lib/supabase/types.ts` missing Stage 1 tables and the J9 columns.
- `GET /api/admin/properties/[id]` uses `select("*")`.
- `PropertyDetails.tsx`: placeholder `wa.me/91XXXXXXXXXX`, dead "Schedule Visit" button, non-existent `--color-brand-soft` token, gradient and off-palette green.
- `PropertiesList.tsx` references CSS classes that do not exist (`card-surface`, `btn-primary-hero`, `btn-outline`).
- Two unreconciled CSS token systems in `globals.css`.
- Four duplicated lead-form implementations.
- `lib/.env.local` tracked in git (staged as deleted, not committed).
- Historical `audit_log` rows still contain buyer PII.

**CAN WAIT**
- Dead packages: `framer-motion`, `react-slick`, `slick-carousel`, `embla-carousel-react`, `lucide-react`, the `shadcn`/`@base-ui` set, `baseline-browser-mapping`.
- 16 orphaned components, `components/layout/*`, `lib/properties.ts`, `components/lib/properties.ts`, `types/react-slick.d.ts`.
- Stale `docs/reference/*` and the governance docs untouched since 2026-07-12.
- Geist vs Inter (DEC-008).
- No Navbar/Footer on `/properties` and `/properties/[slug]`.
- `ProjectsGrid.tsx` lacks the motion reveal its siblings have.

---

## PART 30 — DECISION LOG

Dates appear only where the repo records them.

| Decision | Why | Date / stage | Prevents | Enables |
|---|---|---|---|---|
| Never claim unverified scale or inventory (DEC-005) | Trust-first positioning | undated | False advertising | Honest brand |
| RERA claims property-specific only (DEC-011) | Regulatory accuracy | undated | Blanket badges | Per-listing disclosure |
| Gold as accent only (DEC-009) | Restraint | undated | Cheap visuals | Luxury identity |
| Major changes need owner approval (DEC-014) | Owner control | undated | Silent drift | Deliberate evolution |
| Invite-only, no public signup | Curation over scale | 2026-08-17 | Open marketplace | Quality gating |
| Service-role key in one route only | Least privilege | 2026-08-17 | Broad blast radius | Safe admin actions |
| Extend `profiles`, not a new `broker_profiles` | Avoid duplicate schema | 2026-08-17 | Divergent models | One identity table |
| `middleware.ts` → `proxy.ts` | Next.js 16 convention | 2026-08-17 | Build warnings | Supported API |
| CMS extends `properties`/`builders` | No duplicate tables | 2026-08-18 | Fragmentation | One listing table |
| `deals` RLS tightened | Broker could fabricate a second broker | 2026-09-18 | Fake attribution | Safe future feature |
| `profiles` self-escalation closed (AUD-01) | Self-set `status='active'` | 2026-09-19 | Bypassing approval | Trustworthy gate |
| Legacy JSON and `/api/properties` removed (F17) | One source of truth | 2026-09-19 | Divergent data paths | Supabase-only reads |
| Stage 0: narrow broker read scope | Brokers saw everything | 2026-09-21 | Over-exposure | Least privilege |
| Stage 0: audit provenance + PII redaction | NULL actors, PII in an unerasable store | 2026-09-21 | Ambiguity, PII sprawl | Meaningful audit |
| Pre-registration public mode | No agent registration yet | Stage 0/1 era | Advertising without registration | Safe holding state |
| Locked decision 1: precedence order | Developer knows its own stock | Stage 1 | Arbitrary conflicts | Deterministic winner |
| Locked decision 2: freshness 7/14/30 in rows | Policy, not code | Stage 1 | Deploys for tuning | Admin control |
| Locked decision 3: publication invariant | "Verified" must mean someone verified | Stage 1 | Self-asserting flags | Attributable verification |
| Locked decision 4: roles may coexist | Reality is multi-source | Stage 1 | False exclusivity | Honest provenance |
| Locked decision 5: `properties` untouched | Four FKs depend on it | Stage 1 | Breaking the live site | Additive migration |
| Locked decision 6: no auto-conversion of `source_broker_id` | Data entry ≠ sourcing | Stage 1 | Fabricated provenance | Evidence-based sourcing |
| Locked decision 7: no backfill | Mapping needs judgement | Stage 1 | Silent wrong data | Deliberate Stage 1B |
| Locked decision 8: no anon policy on Stage 1 | Keep new surface private | Stage 1 | Accidental exposure | Controlled rollout |
| No `pg_trgm` in Stage 1 | Keep detection simple | Stage 1 (J6) | Fuzzy false merges | Later, as its own migration |
| Detection automated, merge manual | Identity is a human call | Stage 1 (J6) | Automatic merges | Reviewable candidates |
| Availability derived, never stored | Listings stay "available" forever | Stage 1 (J5/J8) | Silent staleness | Honest inventory |
| Two test properties excluded | Obvious test data | 2026-09-22 | Polluting canonical data | Clean migration |
| Lodha left unmapped | Mixed project/unit, evidence gaps | 2026-09-22 | Inventing facts | Evidence-first mapping |

---

## PART 31 — WHAT HAS ACTUALLY BEEN ACHIEVED

| Phase | Achievement | Evidence | Current status |
|---|---|---|---|
| Initial website | Luxury marketing site, JSON data | commit `158a7bae`; live production build | **Still what production serves** |
| Supabase adoption | Real Postgres schema, 8 tables, RLS | `20260816*` migrations; live rows | Live (database) |
| Broker architecture | Invite-only auth, approval gate | commit `9a6938fa`; `/broker/*`, `/admin/brokers` | Repo only |
| Admin CMS | Full property CRUD with uploads | commit `79a91185`; `/admin/properties` | Repo only |
| Lead CRM | Assignment, statuses, notes | `20260819100000`; `/admin/leads`, `/broker/leads` | Repo only |
| Security hardening | Lead validation/escaping, error masking, CSP, headers | `app/api/leads/route.ts`, `next.config.js`, `lib/api/serverErrorResponse.ts` | Repo only |
| Security fixes verified live | `deals` RLS; AUD-01 profile escalation | Owner-run SQL verification, 2026-09-18 / 09-19 | Live (database) |
| F17 single source of truth | Legacy JSON and endpoint removed | Route table 25→24; local probes | Repo only |
| Stage 0 | Broker scope narrowed; audit provenance and PII redaction | `20260921*` migrations | Live (database) |
| Pre-registration mode | Compliance gate on all public inventory | `lib/compliance/publicMode.ts`; local probes | Repo only |
| Stage 1 (J1–J9) | Canonical schema, 9 tables, view, integrity triggers | `20260922*`; reference rows present | Live (database) |
| Stage 1 verification (J10) | Read-only verification script | `…090900`; owner reports passing | Live (read-only) |
| App compatibility audit | Lint, build, smoke tests, RLS replay | This audit series, 2026-09-22 | Passed |
| Stage 1B legacy cleanup | 2 test rows excluded, guarded SQL | Live query: 2 rows `excluded` | Done |
| Lodha evidence collection | Registered name, promoter, lapsed-list membership | MahaRERA primary sources | Partial |

---

## PART 32 — WHAT IS STILL MISSING

**CRITICAL**
- A deliberate production deployment of the current codebase, with environment variables configured.
- Diagnosis and closure of the `invites` anonymous-read exposure.
- Committing the 65 uncommitted working-tree entries.
- Pinnacl's own MahaRERA agent registration number.
- Removal of the unsupported claims currently live on production.

**IMPORTANT**
- Remaining Lodha evidence: registration date, certificate, extension, address, tower scope.
- A decision on whether anonymous inserts into `leads` are acceptable.
- Admin UI for projects, developers and source parties — Stage 1 is unreachable without SQL.
- Regenerated database types.
- Lead source and attribution fields.
- Reconciliation of the Sheets/email path with the CRM.

**LATER**
- Broker submission workflow; availability claim capture; duplicate review UI; site visits; deals; commissions; payments; disputes; collaboration; reporting; "Pinnacl Pro".

---

## PART 33 — NEXT 10 TECHNICAL STEPS

None of these were performed.

| # | Step | Why | Depends on | Read-only first | May change data | Must not change | Expected result |
|---|---|---|---|---|---|---|---|
| 1 | Diagnose `invites` exposure | Tokens and emails are publicly readable | — | `select relrowsecurity from pg_class where relname='invites'; select * from pg_policies where tablename='invites';` | Nothing yet | No other policy | Root cause known |
| 2 | Close the exposure | Invite links must not be public | 1 | Re-run the same probe after | One policy or RLS flag on `invites` | Other tables; existing rows | Anon reads return 0 |
| 3 | Commit the working tree | 65 entries unversioned | — | `git status`, `git diff` | Git only | No secrets staged | Recoverable history |
| 4 | Decide the deployment question | Production is stale and non-compliant | 3 | Compare live vs repo routes | Vercel deployment + env vars | Database | Live site matches intent |
| 5 | Verify env vars in the deployment target | Broker/admin 500s come from missing config | 4 | List configured keys | Vercel env only | Values in `.env.local` | Gated routes work |
| 6 | Re-verify Stage 0/1 policies live | Most claims rest on migration files | — | Run J10 blocks in the SQL Editor | Nothing | Everything | Verified inventory |
| 7 | Retrieve the Lodha certificate | Closes 4 evidence gaps at once | — | Browser at detail id 10063 | Nothing | Nothing | Dated evidence artefact |
| 8 | Create `developers` + `projects` (draft) | Both are evidence-backed now | 7, owner approval | Confirm both tables empty | 2 inserts | `properties`, RLS | Canonical identity exists |
| 9 | Decide the `leads` anon-insert policy | Rate limiting is bypassable | — | Review the policy | One policy | Existing leads | Intentional posture |
| 10 | Regenerate `types.ts` | Stale types block Stage 1 code | CLI access | Diff generated vs current | One file | Runtime code | Types match schema |

---

## PART 34 — FOUNDER EXPLANATION (simple language)

**Abhi tumhare paas kya hai** — Ek achhi luxury website hai jo live chal rahi hai, lekin woh **purani** hai. Naya system — admin panel, broker login, CRM, compliance — sab code mein ready hai, par live nahi hai.

**System ka core kya hai** — Supabase database. Har cheez wahin se aati hai aur database khud decide karta hai kaun kya dekh sakta hai.

**Data kaise flow karta hai** — Visitor form bharta hai → `/api/leads` check karta hai → lead database mein jaati hai, saath hi Google Sheet aur email mein bhi → aap admin panel mein dekhte ho.

**Broker ka role kya hai** — Sirf invite se account banta hai. Aapki approval ke baad hi andar aa sakta hai. Abhi broker sirf approved listings dekh sakta hai aur apni assigned leads — kuch upload nahi kar sakta.

**Inventory ka role kya hai** — Abhi tak inventory ka matlab ek simple listing tha. Naya design kehta hai: har unit ki availability ek **claim** hai — kisne kaha, kab kaha. Purana ho jaye to system khud "stale" mark karta hai.

**Project ka role kya hai** — Project ek pehchaan hai: naam, developer, RERA number. Pehle project aur unit ek hi row mein mix the — ab alag hain.

**Lead ka role kya hai** — Lead hi business ki shuruaat hai. Abhi 15 leads hain, sab soft-deleted, kisi ko broker assign nahi hua.

**Deal ka role kya hai** — Deal tab banega jab sauda close ho. Table bana hua hai, par abhi koi code use nahi karta — zero deals.

**Commission kaise future me track hoga** — Har deal ka apna agreement, apna proof, aur ledger mein clear split. Sabse important baat: **kisi ek field se commission decide nahi hoga.** Jo banda data enter karta hai, woh automatically commission ka haqdar nahi ban jaata.

**AI kaha use hoga** — Duplicate dhoondhna, purani availability flag karna, report banana, draft likhna, audit chalana.

**Human approval kaha rahega** — RERA verify karna, project publish karna, lead assign karna, duplicate merge karna, deal verify karna, commission decide karna. Yeh sab hamesha aapke haath mein.

**Abhi kya live hai** — Purani website, purani teen dummy listings, aur `/about` par "50+ Projects" jaisa claim jo sach nahi hai. Admin aur broker live nahi hain.

**Abhi kya intentionally closed hai** — Nayi build mein property listings band hain, kyunki aapka MahaRERA agent number abhi set nahi hai. Yeh safety ke liye hai.

**Future me system kya banega** — Ek closed network: verified brokers, verified projects, har unit ki fresh availability, har deal ka saaf hisaab, aur har cheez ka record.

---

## PART 35 — FINAL ONE-PAGE MASTER MAP

| | |
|---|---|
| **Current business** | Boutique luxury real-estate advisory, one owner, one broker account, pre-registration for MahaRERA agent status |
| **Current products** | Public marketing site (deployed, stale) · admin CMS + CRM (built, not deployed) · broker portal (built, not deployed) |
| **Current database** | Supabase Postgres, 19 tables + 1 view. Live data: 3 properties, 15 leads, 2 profiles, 4 builders, 1 invite, 56 audit rows, 7 reference rows. Everything canonical and transactional is empty |
| **Current security** | RLS everywhere, role checks duplicated in code, single service-role route, audit with provenance and PII redaction, soft deletes, immutability triggers. **Two confirmed open issues:** anon-readable `invites`, anon-writable `leads` |
| **Current compliance mode** | Pre-registration in the repo build — all public inventory hidden. **Not deployed:** production still advertises listings and unsupported claims |
| **Current data model** | Legacy `properties` is authoritative; canonical project/inventory layer exists but is empty; the two are linked by three nullable columns |
| **Current revenue flow** | Enquiry → email/Sheet/CRM → offline conversation → offline transaction. Nothing after the lead is in the system |
| **Current limitations** | Stale deployment; no public inventory; no broker self-upload; no deals or commissions; leads unassigned; Stage 1 reachable only via SQL |
| **Stage completed** | Stage 0; Stage 1 J1–J9 with J10 verification; Stage 1B analysis and test-row exclusion |
| **Current stage** | Stage 1B — legacy mapping, one row at a time |
| **Next stage** | Create `developers` and `projects` from evidence; deploy; obtain the agent registration |
| **Biggest open questions** | Which tower/tier the Lodha listing belongs to; what "lapsed" means for it; why `invites` is publicly readable; whether the old production build was deployed deliberately |
| **Biggest known risks** | Live site publishes unsupported claims; invite tokens exposed; anonymous lead writes; production/repo divergence |
| **What not to touch** | `properties` columns (10 files depend on them); `source_broker_id`; `audit_log` rows; applied migrations; the `properties` Storage bucket holding the Lodha images; J10 (never run as a migration) |
| **What can safely be developed next** | Anything reading Stage 1 tables (no code depends on them); admin UI for projects and developers; type regeneration; lead-form consolidation; dead-code removal |

---

## PART 36 — EVIDENCE RULE

Evidence is cited inline throughout. Summary of what this audit actually touched:

- **Source files read:** `package.json`, `next.config.js`, `proxy.ts`, `app/page.tsx`, `app/properties/page.tsx`, `app/properties/[slug]/page.tsx`, `app/sitemap.ts`, `app/robots.ts`, `app/layout.tsx`, `app/broker/dashboard/page.tsx`, `app/admin/leads/LeadsAdminClient.tsx`, `app/api/leads/route.ts`, `app/api/admin/properties/route.ts`, `app/api/admin/properties/[id]/route.ts`, `app/api/broker/accept-invite/route.ts`, `lib/compliance/rera.ts`, `lib/compliance/publicMode.ts`, `lib/api/serverErrorResponse.ts`, `lib/supabase/propertyImageUrl.ts`, `components/ReraDisclosure.tsx`, `app/locations/location-map.ts`, plus repo-wide greps for `.from(`, `.rpc(`, `migration_state`, `wa.me`.
- **Migrations read:** all 16 files in `supabase/migrations/`, plus `supabase/seed.sql`.
- **Database:** read-only SELECT and count queries via service-role and anon keys — row counts for 19 tables and 1 view, full `properties` rows, `builders`, `profiles`, `invites`, lead summaries, audit rows, Stage 1 reference rows.
- **Production:** HTTP probes of `https://pinnaclproperties.com` (9 routes, sitemap, page content).
- **Local build:** `npm run lint` (exit 0), `npm run build` (exit 0, 24 routes), production-server smoke tests on 23 routes.
- **External:** MahaRERA portal, lapsed-projects list and CSV export, deregistered list, abeyance list.

Anything not covered by the above is marked UNKNOWN or NOT VERIFIED in place.

---

## PART 37 — AUDIT CLOSE

1. **MASTER SYSTEM MAP created** — `docs/MASTER_SYSTEM_MAP.md` (this file). It is the only file written.
2. **Files inspected** — ~40 source files, 16 migrations, `seed.sql`, `package.json`, `next.config.js`, `.env.example`, git metadata.
3. **Database objects inspected** — 19 tables, 1 view, 12 functions and their triggers (from migrations), RLS policies (from migrations plus behavioural probes), row counts, and anonymous visibility for every table.
4. **Production state checked** — 9 routes, sitemap contents, page content, hosting IP, and the stale-build divergence.
5. **Unknowns remaining** — live `pg_policies`/`pg_trigger` state; the root cause of the `invites` exposure; which build production runs and whether that was deliberate; whether Sheets and Resend work in production; Lodha's registration date, certificate, extension, address and tower scope; the legal meaning of "lapsed"; J10's actual output.
6. **No application code or database data was modified.**
