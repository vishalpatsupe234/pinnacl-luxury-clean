-- Pinnacl Properties — Lead Requirement Capture
--
-- ############################################################
-- WHY
--
-- A real estate consultant needs to know what the buyer actually wants before
-- any matching, shortlisting or site visit is possible. Until now that
-- information had nowhere to live: it arrived in the free-text `message`
-- column or a lead note, which cannot be filtered, aggregated or matched
-- against inventory. The practical consequence was re-asking the same
-- questions on every call.
--
-- This migration adds exactly seven nullable columns and nothing else.
-- ############################################################

-- ============================================================
-- DELIBERATELY NOT CHANGED
--
--   leads.status          — the seven stages stay exactly as they are
--                           (new, contacted, qualified, site_visit,
--                           negotiation, closed, lost). leads_status_check is
--                           not touched; no stage is added or renamed.
--   existing columns      — nothing dropped, renamed or retyped.
--   existing rows         — all seven columns are NULLABLE with NO DEFAULT, so
--                           every one of the 17 existing leads keeps working
--                           unchanged and simply reads "not recorded". No
--                           backfill: inventing a budget or timeline for a
--                           historical lead would be fabricating data.
--   RLS policies          — not weakened, widened or replaced. The policies
--                           from 20260927090000 stand verbatim.
--   enforce_lead_broker_column_guard() — NOT MODIFIED. See the note below;
--                           no change is required for a broker to record
--                           requirements, and changing it would alter
--                           security behaviour that was verified 15/15 in
--                           production on 2026-09-30.
--   lead_source / assigned_at / contacted_at / next_action_at
--                         — behaviour untouched. assigned_at remains
--                           trigger-owned; contacted_at remains a deliberate
--                           server-stamped event.
--   audit                 — the existing leads_audit trigger already records
--                           every INSERT/UPDATE with before/after values, so
--                           requirement edits are auditable automatically.
--                           No new audit wiring is needed.
-- ============================================================

-- ============================================================
-- A NOTE ON BROKER WRITE ACCESS — read before changing the guard
--
-- enforce_lead_broker_column_guard() (installed as
-- leads_00_broker_column_guard) is a DENY-LIST: it enumerates eleven
-- protected columns and raises only when one of those changed. It is NOT an
-- allow-list. Consequently every column added to public.leads is implicitly
-- writable by an authenticated broker on a lead assigned to them, with no
-- trigger change at all.
--
-- That is the behaviour wanted here — the broker on the call is the person who
-- collects the requirement — so this migration deliberately leaves the guard
-- alone. The eleven protected columns (buyer contact details, the enquiry
-- message, property attribution, assignment, lead_source, assigned_at,
-- deleted_at, created_at) remain exactly as protected as they were, and the
-- C3 verification of them on 2026-09-30 remains valid.
--
-- WORTH KNOWING, and reported rather than silently fixed: because the guard
-- is a deny-list it FAILS OPEN for new columns, and its exception message
-- still reads "a broker may only change status, contacted_at and
-- next_action_at". After this migration a broker may also change the seven
-- requirement columns, so that message understates what is permitted.
-- Converting the guard to an allow-list would make it fail closed for future
-- columns, but that is a change to verified security behaviour and belongs in
-- its own task, not here.
-- ============================================================

-- ============================================================
-- 1. COLUMNS
--
-- Types follow the conventions already in this schema:
--   * numeric for money, as used by commission_ledger.gross_commission
--   * text + a CHECK constraint mirroring a runtime whitelist in
--     lib/supabase/types.ts, as used by leads_status_check and
--     leads_lead_source_check
-- ============================================================
alter table public.leads
  add column if not exists budget_min         numeric,
  add column if not exists budget_max         numeric,
  add column if not exists configuration      text,
  add column if not exists preferred_locality text,
  add column if not exists purpose            text,
  add column if not exists timeline           text,
  add column if not exists financing_status   text;

-- ============================================================
-- 2. BUDGET CONSTRAINTS
--
-- Non-negative only. NO minimum is enforced and no value is required: real
-- buyer requirements are approximate, frequently one-sided ("under 2 crore",
-- "at least 1.5"), and often unknown on first contact. A half-filled range is
-- more useful than a forced guess, so each bound is independently nullable.
-- ============================================================
alter table public.leads
  drop constraint if exists leads_budget_min_non_negative;
alter table public.leads
  add constraint leads_budget_min_non_negative
  check (budget_min is null or budget_min >= 0);

alter table public.leads
  drop constraint if exists leads_budget_max_non_negative;
alter table public.leads
  add constraint leads_budget_max_non_negative
  check (budget_max is null or budget_max >= 0);

-- Ordering is only asserted when BOTH bounds are present, so recording just
-- one of them is always allowed. This catches a transposed range — a genuine
-- data-entry error that would otherwise silently break any future matching —
-- without imposing a minimum budget.
alter table public.leads
  drop constraint if exists leads_budget_range_valid;
alter table public.leads
  add constraint leads_budget_range_valid
  check (
    budget_min is null
    or budget_max is null
    or budget_max >= budget_min
  );

-- ============================================================
-- 3. ENUMERATED REQUIREMENT CONSTRAINTS
--
-- Each list mirrors its runtime counterpart in lib/supabase/types.ts exactly
-- — the same two-layer arrangement already used for LEAD_STAGES and
-- LEAD_SOURCES: the TypeScript array gives the API boundary a clean 400, the
-- CHECK constraint is the boundary that cannot be bypassed. Keep both in
-- sync; neither is authoritative alone.
--
-- NULL is permitted on all four and means "not recorded" — the correct value
-- for an existing lead and for a buyer who has not said yet.
--
-- Values are stored as snake_case tokens, not display strings, matching how
-- status and lead_source are stored. Human labels live in
-- LEAD_*_LABELS in lib/supabase/types.ts, so wording can change without a
-- migration and without rewriting stored data.
-- ============================================================

-- configuration carries an explicit 'other' member so an unusual
-- requirement has a home without defeating aggregation; the specifics go in a
-- lead note. A free-text column was considered and rejected: this field exists
-- to be filtered and matched on, which free text cannot support.
alter table public.leads
  drop constraint if exists leads_configuration_check;
alter table public.leads
  add constraint leads_configuration_check
  check (
    configuration is null
    or configuration in (
      'studio', '1_bhk', '2_bhk', '3_bhk', '4_bhk', '5_plus_bhk',
      'penthouse', 'villa', 'plot', 'commercial', 'other'
    )
  );

alter table public.leads
  drop constraint if exists leads_purpose_check;
alter table public.leads
  add constraint leads_purpose_check
  check (purpose is null or purpose in ('end_use', 'investment', 'other'));

alter table public.leads
  drop constraint if exists leads_timeline_check;
alter table public.leads
  add constraint leads_timeline_check
  check (
    timeline is null
    or timeline in (
      'immediate', '1_3_months', '3_6_months',
      '6_12_months', '12_plus_months', 'unknown'
    )
  );

alter table public.leads
  drop constraint if exists leads_financing_status_check;
alter table public.leads
  add constraint leads_financing_status_check
  check (
    financing_status is null
    or financing_status in (
      'self_funded', 'home_loan', 'partially_funded', 'unknown'
    )
  );

-- preferred_locality is deliberately UNCONSTRAINED free text. Locality names
-- are messy, hyper-local and inconsistently spelled ("Ambernath East",
-- "Ambernath (E)"), and a buyer frequently names two or three. Constraining it
-- now would force a taxonomy nobody has agreed on. Length is capped at the API
-- boundary instead.

-- ============================================================
-- 4. COMMENTS
-- ============================================================
comment on column public.leads.budget_min is
  'Lower bound of the buyer budget, in INR. Nullable and independently optional - buyer requirements are approximate and often one-sided. No minimum is enforced.';

comment on column public.leads.budget_max is
  'Upper bound of the buyer budget, in INR. Nullable and independently optional. leads_budget_range_valid asserts ordering only when both bounds are present.';

comment on column public.leads.configuration is
  'Requested unit configuration, from a fixed allowlist (see leads_configuration_check and LEAD_CONFIGURATIONS in lib/supabase/types.ts). Stored as a snake_case token; display labels live in TypeScript. NULL means not recorded.';

comment on column public.leads.preferred_locality is
  'Free text, deliberately unconstrained: locality names are hyper-local and inconsistently spelled, and a buyer often names several. Length is capped at the API boundary, not here.';

comment on column public.leads.purpose is
  'Why the buyer is purchasing: end_use, investment or other. NULL means not recorded.';

comment on column public.leads.timeline is
  'How soon the buyer intends to transact. NULL means not recorded; ''unknown'' means asked but not known, which is a different and useful fact.';

comment on column public.leads.financing_status is
  'How the purchase will be funded: self_funded, home_loan, partially_funded or unknown. NULL means not recorded.';

-- ============================================================
-- 5. INDEX
--
-- One partial index only. budget and configuration are the two fields any
-- future matching query would filter on first, and a partial index skips the
-- rows where nothing was recorded - which today is all 17 of them.
-- No index on purpose/timeline/financing_status: at current volume they would
-- cost writes and return nothing a sequential scan would not.
-- ============================================================
create index if not exists leads_configuration_idx
  on public.leads (configuration)
  where configuration is not null;

-- ============================================================
-- ROLLBACK (for reference — not executed by this migration)
--
--   drop index if exists public.leads_configuration_idx;
--   alter table public.leads
--     drop constraint if exists leads_financing_status_check,
--     drop constraint if exists leads_timeline_check,
--     drop constraint if exists leads_purpose_check,
--     drop constraint if exists leads_configuration_check,
--     drop constraint if exists leads_budget_range_valid,
--     drop constraint if exists leads_budget_max_non_negative,
--     drop constraint if exists leads_budget_min_non_negative;
--   alter table public.leads
--     drop column if exists financing_status,
--     drop column if exists timeline,
--     drop column if exists purpose,
--     drop column if exists preferred_locality,
--     drop column if exists configuration,
--     drop column if exists budget_max,
--     drop column if exists budget_min;
--
-- Dropping the columns discards the data they hold. No other object is
-- affected: no policy, trigger or function is created or altered here.
-- ============================================================

-- ============================================================
-- POST-APPLY VERIFICATION (read-only — run separately, not part of this file)
--
--   select column_name, data_type, is_nullable
--   from information_schema.columns
--   where table_schema='public' and table_name='leads'
--     and column_name in ('budget_min','budget_max','configuration',
--                         'preferred_locality','purpose','timeline',
--                         'financing_status')
--   order by column_name;
--   -- expect 7 rows, all is_nullable = YES
--   -- budget_min/budget_max = numeric, the rest = text
--
--   select conname from pg_constraint
--   where conrelid='public.leads'::regclass and contype='c'
--   order by conname;
--   -- expect the 6 new ones alongside the pre-existing
--   -- leads_status_check and leads_lead_source_check
--
--   select count(*) from public.leads;                        -- expect 17
--   select count(*) from public.leads
--    where configuration is null and purpose is null;         -- expect 17
--
--   select policyname, cmd from pg_policies
--   where schemaname='public' and tablename='leads' order by policyname;
--   -- expect the SAME 3 policies as before: unchanged
--
--   select tgname from pg_trigger
--   where tgrelid='public.leads'::regclass and not tgisinternal order by tgname;
--   -- expect the SAME 4 triggers, still in this order:
--   --   leads_00_broker_column_guard, leads_assignment_timestamp,
--   --   leads_audit, leads_set_updated_at
--
-- Behavioural:
--   admin sets budget/configuration/purpose      -> succeeds
--   broker sets the same on their assigned lead  -> succeeds (deny-list guard)
--   broker sets buyer_phone                      -> still rejected
--   budget_max < budget_min                      -> rejected (23514)
--   configuration = 'mansion'                    -> rejected (23514)
--   existing lead with all 7 NULL                -> renders unchanged
-- ============================================================
