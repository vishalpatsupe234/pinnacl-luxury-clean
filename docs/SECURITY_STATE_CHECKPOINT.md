# PINNACL PROPERTIES — SECURITY STATE CHECKPOINT

**Captured:** 2026-09-24 · **Mode:** read-only audit · **Branch:** `stable` · **HEAD at capture:** `f3140c77`

**Amended:** 2026-09-24 — B1 and B2 closed. Source: verified in Supabase SQL Editor after checkpoint capture, plus a read-only `audit_log` payload investigation. Amended sections: the callout below, §3, §6.

**Amended:** 2026-09-25 — **HEAD is now `4483c181`, nine commits ahead of `origin/stable` and unpushed.** B3 closed (migration history repaired and verified). Amended sections: the callout below, §1, §5, §6. Sections 2, 3 and 4 — production probes, `properties` RLS, and the compliance posture — are unchanged and still current.

> **⚠️ The nine new commits are NOT deployed.** `origin/stable` is still `f3140c77`, so production continues to serve that commit. Every production claim in §2 therefore remains accurate. Do not read the new commits as live.

This records the verified state of the system immediately after the pre-registration public-mode deployment and the `properties` RLS change. Nothing was built, changed, applied or deployed while capturing it.

Every claim carries an evidence label. The labels are load-bearing — do not read an inferred claim as a verified one:

| Label | Meaning |
|---|---|
| **VERIFIED LIVE** | observed directly in this session against the live system |
| **VERIFIED FROM CODE** | read from a file in this repository |
| **NOT VERIFIED** | could not be observed from this environment; a query or check is given |
| **UNEXPLAINED** | observed, but the cause is unknown and is not being guessed at |

> **Both items that originally needed a human have since been closed.** Verified in Supabase SQL Editor after checkpoint capture, plus a follow-up read-only audit-log investigation. See §6.
> 1. ~~The four `properties` RLS policies are NOT VERIFIED~~ — **RESOLVED.** All four confirmed present and scoped `{authenticated}`; RLS enabled; anon visibility 0.
> 2. ~~Two `properties` UPDATE rows from 2026-09-22 are UNEXPLAINED~~ — **RESOLVED.** Two soft-deleted test fixtures, `migration_state` only.
>
> 3. ~~B3 — `supabase db push` is unsafe until migration history is repaired~~ — **RESOLVED 2026-09-25.** History repaired and verified; see §5.
>
> **No blockers remain.** Remaining items are future cleanup (§6).

---

## 1. Git

**VERIFIED LIVE.**

Verified 2026-09-25 with `git rev-parse` / `git status -sb`:

```
HEAD          4483c181ef8309719a2c664261e806eef72b2eec
origin/stable f3140c77dbec989b1b05d63c2538b9f7bff67a08
tracking      ## stable...origin/stable      [ahead 9, behind 0]
```

**Nine commits are unpushed.** `origin/stable` — and therefore production — is still `f3140c77`.

### Commit history

Newest first. The nine above the rule are local-only.

| SHA | Subject |
|---|---|
| `4483c181` | chore(supabase): add CLI project config |
| `8fb6c7ee` | chore(deps): upgrade Next 16.3.5, eslint-config-next, sharp 0.35.4 |
| `60bcfdf8` | chore: remove stray directory dumps and tighten ignores |
| `6c8d790c` | chore(db): add security remediation and Stage 1 migrations |
| `7961f0c5` | feat(leads): add lead management CRM for admin and broker |
| `b62499bb` | fix(security): scope broker property reads to approved inventory |
| `87bb2b6c` | feat(admin): add property approval workflow and image upload validation |
| `64209dff` | fix(security): return generic errors from admin and broker API routes |
| `c7e5ce8c` | docs(security): update project state and remove tracked env |
| — | — *(`origin/stable` is at the commit below)* |
| `f3140c77` | feat(compliance): pre-registration public mode and Supabase property source |
| `8168ce0c` | fix(security): close anon property reads during preregistration |
| `d4669b58` | docs: synchronize CLAUDE.md with current architecture |
| `79a91185` | feat(properties): property listings CMS |
| `9a6938fa` | feat(auth): invite-only broker authentication |
| `158a7bae` | feat(ui): luxury homepage redesign |

### Working tree — 3 uncommitted entries

Actual `git status --short`, 2026-09-25:

```
 M .env.example
?? docs/MASTER_SYSTEM_MAP.md
?? docs/SECURITY_STATE_CHECKPOINT.md
```

| Category | Count |
|---|---|
| modified | 1 |
| deleted | 0 |
| staged | 0 |
| untracked | 2 |

The earlier backlog is gone: `lib/.env.local` was untracked by `c7e5ce8c`, and all 22 migrations plus `supabase/verification/` are now committed (`git ls-files` confirms 22 tracked migrations and 1 tracked verification file). What remains is this document, the system map, and the `.env.example` update.

---

## 2. Production

Domain: `https://pinnaclproperties.com`. All rows **VERIFIED LIVE** by HTTP probe.

### Deployed commit — NOT VERIFIED directly

No Vercel API access from this environment. The deployed commit **cannot be read**; it is *inferred* to be `f3140c77` because production behaviour now matches that commit exactly and no longer matches its predecessor. Confirm the SHA in the Vercel dashboard.

Response headers confirm the platform and that the deployment is serving: `Server: Vercel`, `X-Vercel-Cache: HIT`, `X-Nextjs-Prerender: 1`, `X-Vercel-Id: bom1::…` (Mumbai region).

### Route behaviour

| Route | Status | Notes |
|---|---|---|
| `/` | 200 | no inventory, no property search |
| `/about` | 200 | |
| `/contact` | 200 | |
| `/projects` | 308 | → `/properties` |
| `/properties` | 200 | **holding notice only** |
| `/properties/pinnacl-crest-powai` | **404** | placeholder gone |
| `/properties/lodha-world-towers-lower-parel` | **404** | real listing gated |
| `/api/properties` | **404** | endpoint removed |
| `/broker/login` | 200 | **recovered** — returned HTTP 500 on 2026-09-22 |
| `/admin/brokers` | 307 | → `/broker/login`, auth gate working |
| `/sitemap.xml` | 200 | |
| `/locations/mumbai` | 200 | soft-404 — see §6 |

### Content assertions — all zero

| Assertion | Count |
|---|---|
| holding notice present on `/properties` | 1 ✅ |
| placeholder listings on `/properties` | **0** |
| placeholder listings on homepage | **0** |
| `href="/properties"` links on homepage | **0** |
| `"Verified Projects Only"` in footer | **0** |
| `"50+ Projects"` / `"6 Markets"` on `/about` | **0** |

`sitemap.xml` publishes exactly three URLs — `/`, `/about`, `/contact`. No property URLs.

**The three placeholder listings (Pinnacl Crest, Aurelia, Bayview) are gone from production.** This closes the "production is running an old build" finding from the 2026-09-22 audit.

---

## 3. Supabase — `properties` security

### RLS enabled — **VERIFIED** (`rls_enabled = true`)

Verified in Supabase SQL Editor after checkpoint capture. Independently corroborated live: anonymous reads return **HTTP 200 with an empty array**, not 401 — the signature of RLS being enforced with no matching policy. A disabled-RLS table would return rows.

### The four policies — **VERIFIED**

Verified in Supabase SQL Editor after checkpoint capture. Exactly four policies exist on `public.properties`, **all scoped `{authenticated}`** — no policy grants `anon`:

| Policy | Roles | Predicate (VERIFIED FROM CODE) |
|---|---|---|
| `properties_admin_full_access` | `{authenticated}` | `is_super_admin()` |
| `properties_broker_read_approved` | `{authenticated}` | `is_active_broker() and approved and live` |
| `properties_broker_read_own` | `{authenticated}` | `source_broker_id = auth.uid()` |
| `properties_public_read_approved` | `{authenticated}` | `approval_status='approved' and deleted_at is null` |

**`anon_visible_properties = 0`.**

This confirms the critical distinction the anon probe alone could not make: the policy was **narrowed** to `authenticated`, **not dropped**. Authenticated non-admin users retain approved-inventory read, and `20260923091000_properties_close_anon_read_prereg.sql` applied exactly as written.

The caution was warranted — on 2026-09-22 the `invites` table was found with RLS **off** while its migration said otherwise. Repo intent and live state have diverged on this project before; here they agree.

### Visibility matrix — VERIFIED LIVE

| Table | anon | service role |
|---|---|---|
| **properties** | **0** | 3 |
| **builders** | **3** ⚠️ | 4 |
| invites | 0 | 1 |
| profiles | 0 | 2 |
| leads | 0 | 15 |
| audit_log | 0 | 56 |
| projects · developers · source_parties | 0 | 0 |
| project_sources · inventory_units · unit_availability_claims | 0 | 0 |
| project_duplicate_candidates · inventory_units_effective | 0 | 0 |
| deals · commission_ledger · site_visits · lead_notes | 0 | 0 |
| source_party_precedence | 0 | 4 |
| inventory_freshness_policies | 0 | 3 |

`properties` anon visibility moved **1 → 0**. The change is live and effective.

⚠️ **`builders` remains anon-readable** — 3 of 4 rows, returning developer names (`Lodha`, `Godrej Properties`, `Kalpataru`). See §6.

---

## 4. Compliance

**VERIFIED FROM CODE** and **VERIFIED LIVE**.

| Item | State |
|---|---|
| `NEXT_PUBLIC_MAHARERA_AGENT_REG_NO` | **UNSET** — local `.env.local` and Vercel Production, intentionally |
| `NEXT_PUBLIC_PRE_REGISTRATION_PUBLIC_MODE` | UNSET (override not needed) |
| Pre-registration mode | **ACTIVE**, fail-closed |
| Public inventory | **NOT PUBLISHED** at application layer *and* data layer |

The gate (`lib/compliance/publicMode.ts`) resolves as:

```
PRE_REGISTRATION_PUBLIC_MODE = FORCE_FLAG || !AGENT_REGISTRATION_CONFIGURED
```

With no registration number, restriction is unconditional. Setting `NEXT_PUBLIC_PRE_REGISTRATION_PUBLIC_MODE=false` is **deliberately powerless** — one mistyped variable cannot publish inventory while unregistered.

**Two independent gates now protect the same posture:**

| Layer | Control | State |
|---|---|---|
| Application | `NEXT_PUBLIC_MAHARERA_AGENT_REG_NO` unset | closed |
| Data | anon grant removed from `properties_public_read_approved` | closed |

**Reversal order when registration is issued:** set the env var and deploy **first**, then restore the anon grant. Restoring the policy alone republishes nothing but reopens direct REST readability before the site can use it.

Note the legal posture: this is a cautious operating choice by the owner, **not a legal opinion**. Whether specific pre-registration activity is permitted **REQUIRES LAWYER**.

---

## 5. Migration state

_This section was rewritten 2026-09-25. It previously reported history as **NOT TRACKED** with a "DO NOT RUN `db push`" blocker. That has been resolved — the text below replaces it._

### Local files — **22 migrations**, all committed

`supabase/migrations/` holds exactly 22 `.sql` files, all tracked (`git ls-files` → 22).

**22, not 23.** `20260922090900_stage1_j10_verification_readonly.sql` is **verification-only** — pure read-only `SELECT` blocks, and its own header says it must never be applied as a migration. It was moved to **`supabase/verification/`** on 2026-09-24 (1 tracked file) so it cannot be applied or repaired into history.

### Tracking status — **REPAIRED AND VERIFIED**

- Migration history was backfilled with `supabase migration repair --status applied` using **`--db-url`**.
- A subsequent read-only `supabase migration list` reported **Local = Remote for all 22 versions**.
- CLI version used: **2.117.0**.

**`supabase link` was not usable.** It fails on the Management API api-keys endpoint (`GET /v1/projects/.../api-keys`) — an authorization bug in CLI 2.117.0, tracked as Supabase issue #6445. The Owner-level token and the Management API itself both work; only the CLI's link flow is affected. `--db-url` connects straight to Postgres and bypasses the Management API entirely, which is why it succeeded.

**`migration repair` writes only the history table — it never replays migration SQL.** The backfill therefore applied no schema change.

### ⚠️ `db push` — remaining caution, no longer a blocker

History is repaired, so `db push` now has a correct baseline and will not attempt a full replay. **Four migrations are nevertheless non-idempotent**, so any future situation that replays them would fail:

| Migration | Bare `create` statements |
|---|---|
| `20260816120000_core_tables.sql` | 17 |
| `20260816120100_transaction_and_audit_tables.sql` | 19 |
| `20260817090000_broker_auth_invites.sql` | 5 |
| `20260819100000_lead_management_crm.sql` | 4 |

Such a replay aborts on the first with `42P07 relation already exists`, inside a transaction, before touching anything — it fails safe. Treat `db push` with care and prefer reviewing `migration list` output first; **do not treat history as empty or unrepaired.**

---

## 6. Open issues

### Blockers — **none remain**

All three blockers from the original capture are closed. Remaining items are future cleanup, below.

### Blockers closed

**B3 · `db push` unsafe / migration history unrepaired — RESOLVED 2026-09-25.** History was repaired with `migration repair --status applied` over `--db-url` and verified by a read-only `migration list` showing Local = Remote for all 22 versions. `db push` retains a non-idempotency caution but is no longer a blocker. Full detail in §5.

**B1 · `properties` RLS policies — RESOLVED.** Verified in Supabase SQL Editor after checkpoint capture: `rls_enabled = true`, exactly four policies, all `{authenticated}`, `anon_visible_properties = 0`. The `authenticated` grant survived the anon removal — the policy was narrowed, not dropped. Full detail in §3.

**B2 · Two `properties` UPDATE rows — RESOLVED, not unexplained.** A read-only investigation of the `before_data`/`after_data` payloads identified both records and the exact delta:

| record_id | property | change |
|---|---|---|
| `fe8d83c9-8276-430c-ac57-22710ac6a945` | ZZZ SECURITY TEST - DELETE ME | `migration_state`: `unmapped` → `excluded` |
| `58e1e283-27a2-4b42-8c54-c8c02d0337a7` | TEST APPROVAL DELETE ME | `migration_state`: `unmapped` → `excluded` |

Both are **soft-deleted test fixtures** (`deleted_at` set 2026-09-18 and 2026-09-20). Across 28 columns, only `migration_state` changed; `updated_at` moved as a consequence of the `set_updated_at` trigger. **`approval_status`, `deleted_at`, `source_broker_id` and `rera_number` were not modified** on either row, so neither row's publication eligibility changed.

**The real listing was not touched.** `d449dbf9-192d-47ef-9ab9-ee2f3c3c12cb` (Lodha World Towers) has exactly two audit rows in its entire history — an `insert` and an `update`, both on 2026-08-19 — and its `updated_at` is still `2026-08-19T15:21:39Z`.

The two rows are **not duplicates**: different `record_id`, different payloads. The identical microsecond timestamp reflects a single set-based `UPDATE … WHERE` inside one transaction, with the row trigger firing once per row and `now()` being transaction-stable.

`'excluded'` is one of the four values defined by J9's `properties_migration_state_check`, added the same day (`20260922090800_stage1_j9_properties_linkage.sql`). Marking dead test rows as excluded from the properties → projects mapping is the intended Stage 1b classification. `actor_type: system` is the correct signature for SQL Editor execution, which carries no `request.jwt.claims` — the same signature the J2 seed rows bear. *Who* ran it cannot be established: `actor_id` is null, inherent to SQL Editor execution.

**Audit-trail limitation recorded while investigating:** rows created **before 2026-09-21** carry `before_data: NULL`, `after_data: NULL` and `actor_type: null`. Payload capture and `actor_type` were introduced by `20260921091000_audit_provenance_and_pii_minimisation.sql`. Earlier entries record *that* a change happened, not *what* changed — a consequence of when the hardening landed, not evidence of tampering.

### Future cleanup — not blocking

**C1 · `builders` anon-readable.** 3 rows of developer names exposed via the public API. Not inventory, but adjacent to the marketing surface the pre-registration posture is meant to close. Decide whether it should match the `properties` treatment.

**C2 · `/locations/[location]` is a soft-404.** Returns HTTP 200 with the not-found body. Compliance-clean — neutral title, `noindex, nofollow`, no inventory, no `/properties` link — but the status code never becomes 404. SEO hygiene only.

**C3 · Production builds on Next 16.1.4.** _(Still current: the dependency upgrade is committed in `8fb6c7ee` but unpushed, so production continues to build from `f3140c77`'s lockfile.)_ `f3140c77` deliberately excludes `package.json`, so Vercel installs from the committed lockfile. Verified working, including a harmless `Unrecognized key(s): 'agentRules'` config warning (that key is 16.3.5+). The dependency bump is a separate future commit.

**C4 · ~~42 uncommitted working-tree entries~~ — LARGELY RESOLVED 2026-09-25.** Nine commits (`c7e5ce8c`..`4483c181`) cleared the backlog; 3 entries remain (this document, the system map, `.env.example`). **All nine are unpushed.** Original note: Lead CRM, 21 migrations, `lib/api/`, docs, `.gitignore`/`.env.example`, `package.json`/lock, and the staged `lib/.env.local` deletion. Each needs its own controlled commit.

**C5 · ~~`20260923091000` applied but untracked~~ — RESOLVED.** It is committed (in `f3140c77`) and recorded in migration history by the 2026-09-25 repair.

**C6 · Stale documentation — PARTIALLY RESOLVED 2026-09-25.**

- ~~`CLAUDE.md` states `/api/leads` reads a key from disk via `GOOGLE_SERVICE_ACCOUNT_KEY_PATH`~~ — **RESOLVED.** `CLAUDE.md` now documents `GOOGLE_SERVICE_ACCOUNT_JSON`; the old variable survives there only inside a struck-through historical note.
- **STILL OPEN:** `CLAUDE.md` records service-role usage as confined to a *single* Route Handler. It is now **two** — `app/api/broker/accept-invite/route.ts` and `app/api/leads/route.ts`. `lib/supabase/admin.ts` documents both correctly, so the code and the memory file disagree. This was an approved widening; the Decision Register entry has not been updated.

**C7 · Retro-redaction of pre-Stage-0 `audit_log` rows** containing buyer PII — still pending explicit authorisation.

### Resolved since the 2026-09-22 audit

- ✅ Production no longer serves the old pre-Supabase build
- ✅ `/api/properties` and the three placeholder listings removed from production
- ✅ `/broker/login` recovered from HTTP 500
- ✅ `invites` no longer anon-readable (token exposure closed)
- ✅ Anonymous direct REST reads of `properties` closed
- ✅ `/api/leads` property attribution no longer depends on the anon grant
- ✅ **B1** — four `properties` policies confirmed `{authenticated}`, RLS enabled, anon visibility 0 *(SQL Editor, after checkpoint capture)*
- ✅ **B2** — the two 2026-09-22 `properties` updates identified as a Stage 1b `migration_state` change on two soft-deleted test fixtures; real listing untouched

---

## Standing constraints

1. **Treat `supabase db push` with care.** Migration history is repaired (§5), but four early migrations are non-idempotent — review `migration list` before pushing. Use `--db-url`; `supabase link` is blocked by CLI issue #6445.
2. **Never set `NEXT_PUBLIC_MAHARERA_AGENT_REG_NO`** to a placeholder, guess, or test value. Only the real issued number.
3. **Restoring anon property reads requires both steps, in order:** env var + deploy first, then the policy migration.
4. **The SQL Editor is the only applied-migration path.** Anything applied there must be recorded in the repo as a migration file, or repo and live state drift silently.
