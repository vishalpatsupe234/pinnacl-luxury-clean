-- Pinnacl Properties — STAGE 1 / J10
-- ############################################################
-- THIS FILE IS NOT A MIGRATION. DO NOT APPLY IT AS ONE.
--
-- It contains ONLY read-only SELECT statements, to be run in the Supabase
-- SQL Editor after J1-J9 have been applied. It creates nothing, alters
-- nothing and writes nothing. Running it is harmless and repeatable.
--
-- Run each numbered block separately and check the stated expectation.
-- ############################################################

-- ============================================================
-- V1. All 9 Stage 1 tables exist, and every one has RLS ENABLED.
-- Expect 9 rows, rls_enabled = true on every row.
-- ============================================================
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'source_party_precedence', 'inventory_freshness_policies',
    'developers', 'source_parties', 'projects',
    'project_sources', 'inventory_units', 'unit_availability_claims',
    'project_duplicate_candidates'
  )
order by c.relname;

-- ============================================================
-- V2. NO anon-reachable policy on any Stage 1 table (locked decision 8).
-- Expect ZERO rows. Any row here is a security failure.
-- ============================================================
select tablename, policyname, roles::text, cmd
from pg_policies
where schemaname = 'public'
  and tablename in (
    'source_party_precedence', 'inventory_freshness_policies',
    'developers', 'source_parties', 'projects',
    'project_sources', 'inventory_units', 'unit_availability_claims',
    'project_duplicate_candidates'
  )
  and (roles::text like '%anon%' or roles::text like '%public%')
order by tablename, policyname;

-- ============================================================
-- V3. Append-only / no-hard-delete enforcement.
-- unit_availability_claims must have NO update and NO delete policy.
-- project_sources must have NO delete policy and NO blanket ALL policy.
-- inventory_units and project_duplicate_candidates (J6 hardening) must have
-- NO delete policy and NO blanket ALL policy — FOR ALL silently includes
-- DELETE.
-- Expect all eight booleans true.
-- ============================================================
with pol as (
  select tablename, cmd from pg_policies where schemaname = 'public'
)
select
  not exists (select 1 from pol where tablename='unit_availability_claims'     and cmd='UPDATE') as claims_no_update_policy,
  not exists (select 1 from pol where tablename='unit_availability_claims'     and cmd='DELETE') as claims_no_delete_policy,
  not exists (select 1 from pol where tablename='project_sources'              and cmd='DELETE') as sources_no_delete_policy,
  not exists (select 1 from pol where tablename='project_sources'              and cmd='ALL')    as sources_no_blanket_all_policy,
  not exists (select 1 from pol where tablename='inventory_units'              and cmd='DELETE') as units_no_delete_policy,
  not exists (select 1 from pol where tablename='inventory_units'              and cmd='ALL')    as units_no_blanket_all_policy,
  not exists (select 1 from pol where tablename='project_duplicate_candidates' and cmd='DELETE') as candidates_no_delete_policy,
  not exists (select 1 from pol where tablename='project_duplicate_candidates' and cmd='ALL')    as candidates_no_blanket_all_policy;

-- ============================================================
-- V4. Audit triggers present on all 9 Stage 1 tables, all bound to the
-- existing public.log_audit_event(). Expect 9 rows.
-- ============================================================
select c.relname as table_name, t.tgname as trigger_name, p.proname as function_name
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
join pg_proc p on p.oid = t.tgfoid
where not t.tgisinternal
  and n.nspname = 'public'
  and p.proname = 'log_audit_event'
  and c.relname in (
    'source_party_precedence', 'inventory_freshness_policies',
    'developers', 'source_parties', 'projects',
    'project_sources', 'inventory_units', 'unit_availability_claims',
    'project_duplicate_candidates'
  )
order by c.relname;

-- ============================================================
-- V5. Reference data seeded exactly as locked. Expect 7 rows total:
-- developer=1, pinnacl=2, broker=3, referrer=4
-- actively_marketed=7, standard=14, long_cycle=30
-- ============================================================
select 'precedence' as kind, party_type as key, precedence_rank as value
from public.source_party_precedence
union all
select 'freshness', policy_key, max_age_days
from public.inventory_freshness_policies
order by kind, value;

-- ============================================================
-- V6. The publication invariant actually bites.
-- Expect: exists = true, and a NULL rera number cannot be 'published'.
-- (The second column proves the constraint expression is present; it does
--  not attempt an insert.)
-- ============================================================
select
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.projects'::regclass
      and conname  = 'projects_publication_invariant_check'
  ) as publication_invariant_exists,
  (
    select pg_get_constraintdef(oid) from pg_constraint
    where conrelid = 'public.projects'::regclass
      and conname  = 'projects_publication_invariant_check'
  ) as definition;

-- ============================================================
-- V7. Canonical key: partial unique index on rera_project_reg_no.
-- Expect one row.
-- ============================================================
select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename  = 'projects'
  and indexname  = 'projects_rera_project_reg_no_key';

-- ============================================================
-- V8. The view exists AND is security_invoker, AND derives the current
-- winner from the LIVE precedence table (J8 hardening).
-- Expect one row with every boolean true.
-- If is_security_invoker is false the view BYPASSES RLS — stop and report.
--
-- The checks read pg_get_viewdef(), which prints the definition in
-- normalised form. PostgreSQL omits "ASC NULLS LAST" there because it is
-- the default for ascending order, so the pattern accepts it with or without
-- the explicit suffix, and live_rank_nulls_last separately rejects any
-- DESC / NULLS FIRST on the live rank.
--   joins_live_precedence    LEFT JOIN source_party_precedence spp
--                            ON spp.party_type = c.claimant_party_type
--   deterministic_order      ORDER BY c.unit_id, spp.precedence_rank,
--                            c.claimed_at DESC, c.created_at DESC, c.id DESC
--   snapshot_not_winner_rank the claim's snapshot c.precedence_rank is not
--                            the ordering rank
--   snapshot_rank_output     c.precedence_rank is still selected and exposed
--                            (historical evidence), alongside
--                            current_precedence_rank (the live rank)
-- ============================================================
select
  c.relname as view_name,
  true      as view_exists,
  coalesce(
    (select option_value = 'true'
     from pg_options_to_table(c.reloptions)
     where option_name = 'security_invoker'),
    false
  ) as is_security_invoker,
  d.def ~* 'LEFT JOIN (public\.)?source_party_precedence spp ON \(+spp\.party_type = c\.claimant_party_type\)+'
    as joins_live_precedence,
  d.def ~* 'ORDER BY c\.unit_id, spp\.precedence_rank( NULLS LAST)?, c\.claimed_at DESC, c\.created_at DESC, c\.id DESC'
    as deterministic_order,
  d.def !~* 'spp\.precedence_rank (DESC|NULLS FIRST)'
    as live_rank_nulls_last,
  d.def !~* 'ORDER BY c\.unit_id, c\.precedence_rank'
    as snapshot_not_winner_rank,
  (d.def ~* 'c\.precedence_rank,' and d.def ~* 'w\.precedence_rank,'
   and d.def ~* 'spp\.precedence_rank AS current_precedence_rank'
   and d.def ~* 'w\.current_precedence_rank')
    as snapshot_rank_output
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
cross join lateral (
  select regexp_replace(pg_get_viewdef(c.oid, true), '\s+', ' ', 'g') as def
) d
where n.nspname = 'public' and c.relname = 'inventory_units_effective';

-- ============================================================
-- V9. redact_audit_pii covers display_name AND resolution_note (J7).
-- Expect one row, both booleans true. The keys are matched as quoted array
-- elements so a mention in a comment cannot satisfy the check.
-- ============================================================
select
  pg_get_functiondef(p.oid) like '%''display_name''%'    as redaction_covers_display_name,
  pg_get_functiondef(p.oid) like '%''resolution_note''%' as redaction_covers_resolution_note
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'redact_audit_pii';

-- ============================================================
-- V10. properties linkage columns added, and NO property row was mapped.
-- Expect: 3 columns listed; total_rows = 3; unmapped_rows = 3.
-- ============================================================
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'properties'
  and column_name in ('project_id', 'inventory_unit_id', 'migration_state')
order by column_name;

select
  count(*)                                             as total_rows,
  count(*) filter (where migration_state = 'unmapped') as unmapped_rows,
  count(*) filter (where project_id is not null)       as mapped_to_project,
  count(*) filter (where inventory_unit_id is not null) as mapped_to_unit
from public.properties;

-- ============================================================
-- V11. NOTHING was created in the new business tables, and existing data is
-- untouched. Expect all the Stage 1 business tables at 0, builders 4,
-- properties 3, and audit_log 54 (47 before Stage 1, plus the 7 J2 seed rows).
-- ============================================================
select 'projects'                     as table_name, count(*) from public.projects
union all select 'developers',                       count(*) from public.developers
union all select 'source_parties',                   count(*) from public.source_parties
union all select 'project_sources',                  count(*) from public.project_sources
union all select 'inventory_units',                  count(*) from public.inventory_units
union all select 'unit_availability_claims',         count(*) from public.unit_availability_claims
union all select 'project_duplicate_candidates',     count(*) from public.project_duplicate_candidates
union all select 'source_party_precedence (seed=4)', count(*) from public.source_party_precedence
union all select 'inventory_freshness_policies (seed=3)', count(*) from public.inventory_freshness_policies
union all select 'builders (unchanged=4)',           count(*) from public.builders
union all select 'properties (unchanged=3)',         count(*) from public.properties
union all select 'audit_log (47 + 7 seed = 54)',     count(*) from public.audit_log
order by table_name;

-- ============================================================
-- V12. Stage 0 controls untouched. Expect exactly the 4 properties policies
-- from Stage 0, and no broker insert/update policy anywhere on properties.
-- ============================================================
select policyname, cmd, roles::text
from pg_policies
where schemaname = 'public' and tablename = 'properties'
order by policyname;
