-- Pinnacl Properties — STAGE 1 / J5
-- project_sources + inventory_units + unit_availability_claims
--
-- ############################################################
-- project_sources IS PROVENANCE EVIDENCE ONLY.
--
-- Locked decision 7. It MUST NEVER imply, and cannot express:
--   lead ownership · collaboration entitlement · closing participant status
--   commission entitlement · payment entitlement
--
-- This is enforced STRUCTURALLY, not by convention: the table has no rate,
-- no share, no percentage, no amount, no payer and no beneficiary column.
-- Entitlement is inexpressible here because no column exists to express it.
-- Commission lives in Stages 4-5 under an explicit agreement.
--
-- Locked decision 4: all four source_role values may coexist on one project
-- simultaneously — a project may be developer_direct AND broker_supplied AND
-- referral at the same time. The unique index below is scoped per
-- (project, party, role) so coexistence is permitted while duplicate
-- assertions of the SAME role by the SAME party are not.
--
-- Locked decision 6: NO project_sources row is created for any existing
-- property. source_broker_id is a data-entry artifact, not sourcing evidence,
-- and is never auto-converted.
-- ############################################################

-- ============================================================
-- 1. project_sources
-- ============================================================
create table if not exists public.project_sources (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.projects(id),
  source_party_id uuid not null references public.source_parties(id),
  source_role     text not null,
  submitted_at    timestamptz not null default now(),
  -- submitted_by is WHO RECORDED IT; source_party_id is WHO THE SOURCE IS.
  -- Collapsing these two is precisely the error source_broker_id made.
  submitted_by    uuid references public.profiles(id),
  evidence_ref    text,
  review_state    text not null default 'pending',
  reviewed_by     uuid references public.profiles(id),
  reviewed_at     timestamptz,
  effective_from  timestamptz not null default now(),
  effective_to    timestamptz,
  superseded_by   uuid references public.project_sources(id),
  note            text,
  created_at      timestamptz not null default now(),
  constraint project_sources_role_check
    check (source_role in ('developer_direct', 'pinnacl_curated', 'broker_supplied', 'referral')),
  constraint project_sources_review_state_check
    check (review_state in ('pending', 'accepted', 'rejected', 'superseded')),
  constraint project_sources_effective_range_check
    check (effective_to is null or effective_to >= effective_from)
);

comment on table public.project_sources is
  'PROVENANCE EVIDENCE ONLY. Records who supplied a project and under what role. Confers NO commission, ownership, lead attribution, collaboration, closing or payment entitlement. No commercial column exists in this table by design.';
comment on column public.project_sources.source_role is
  'How the project reached us: developer_direct | pinnacl_curated | broker_supplied | referral. All four may coexist on one project. Provenance only — never an entitlement signal.';
comment on column public.project_sources.submitted_by is
  'The user who recorded the assertion. Distinct from source_party_id, which is the party being credited as the source.';
comment on column public.project_sources.evidence_ref is
  'Pointer to the artefact this assertion rests on. Frozen at creation by enforce_project_source_provenance_immutable(); correcting it requires superseding the record, not rewriting it.';

-- One currently-effective accepted record per (project, party, role).
-- Supersession sets effective_to first, so history is retained.
create unique index if not exists project_sources_current_accepted_key
  on public.project_sources (project_id, source_party_id, source_role)
  where effective_to is null and review_state = 'accepted';

create index if not exists project_sources_project_id_idx   on public.project_sources (project_id);
create index if not exists project_sources_party_id_idx     on public.project_sources (source_party_id);
create index if not exists project_sources_review_state_idx on public.project_sources (review_state);

-- Provenance facts are immutable. Only review/supersession fields may change.
-- A policy cannot express column-level immutability, so this is a trigger.
--
-- evidence_ref is frozen at creation alongside the other provenance fields.
-- It is the pointer to the artefact the assertion rests on, so a mutable
-- evidence_ref would let an accepted record silently change what it is
-- evidence OF while keeping its acceptance. Correcting the evidence means
-- superseding the record, which leaves the original visible.
--
-- Deliberately still mutable: review_state, reviewed_by, reviewed_at,
-- effective_to, superseded_by, note. Those are the review and supersession
-- machinery, not the assertion itself.
create or replace function public.enforce_project_source_provenance_immutable()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.project_id      is distinct from old.project_id
  or new.source_party_id is distinct from old.source_party_id
  or new.source_role     is distinct from old.source_role
  or new.submitted_at    is distinct from old.submitted_at
  or new.submitted_by    is distinct from old.submitted_by
  or new.evidence_ref    is distinct from old.evidence_ref
  or new.effective_from  is distinct from old.effective_from then
    raise exception
      'project_sources provenance fields are immutable (id %). Supersede the record instead of rewriting it.', old.id;
  end if;
  return new;
end;
$$;

drop trigger if exists project_sources_provenance_immutable on public.project_sources;
create trigger project_sources_provenance_immutable
  before update on public.project_sources
  for each row execute function public.enforce_project_source_provenance_immutable();

-- ------------------------------------------------------------
-- ROLE / PARTY-TYPE CONSISTENCY (cross-table invariant)
--
-- source_role describes HOW a project reached us; source_parties.party_type
-- describes WHAT the party is. The two must agree, or provenance becomes
-- self-contradictory — e.g. a record claiming 'developer_direct' while
-- pointing at a broker party. A CHECK constraint cannot express this because
-- it spans two tables, so it is a trigger.
--
--   developer_direct -> developer
--   pinnacl_curated  -> pinnacl
--   broker_supplied  -> broker
--   referral         -> referrer
--
-- SECURITY DEFINER is deliberate and matches the existing is_super_admin /
-- is_active_broker pattern: the check must be able to resolve the referenced
-- source_parties row regardless of the caller's RLS visibility. It returns no
-- data to the caller — it either permits the write or raises. Without this,
-- a future non-admin writer (Stage 3) could hit a spurious "does not resolve"
-- error simply because RLS hid the row from them.
-- ------------------------------------------------------------
create or replace function public.enforce_project_source_role_matches_party()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_party_type text;
  v_expected   text;
begin
  select sp.party_type into v_party_type
  from public.source_parties sp
  where sp.id = new.source_party_id;

  if v_party_type is null then
    raise exception
      'project_sources.source_party_id % does not resolve to a source_parties row',
      new.source_party_id;
  end if;

  v_expected := case new.source_role
    when 'developer_direct' then 'developer'
    when 'pinnacl_curated'  then 'pinnacl'
    when 'broker_supplied'  then 'broker'
    when 'referral'         then 'referrer'
  end;

  if v_expected is null then
    raise exception
      'project_sources.source_role % has no party_type mapping', new.source_role;
  end if;

  if v_party_type <> v_expected then
    raise exception
      'source_role % requires a source party of type %, but party % is of type %',
      new.source_role, v_expected, new.source_party_id, v_party_type;
  end if;

  return new;
end;
$$;

comment on function public.enforce_project_source_role_matches_party() is
  'Cross-table invariant: project_sources.source_role must agree with source_parties.party_type. Provenance only — enforcing this consistency confers no entitlement of any kind.';

drop trigger if exists project_sources_role_matches_party on public.project_sources;
create trigger project_sources_role_matches_party
  before insert or update on public.project_sources
  for each row execute function public.enforce_project_source_role_matches_party();

-- ============================================================
-- 2. inventory_units
-- NOTE: there is deliberately NO current_availability_state column.
-- Storing current state is exactly how "AVAILABLE forever" happens. State is
-- derived at read time by the J8 view from the append-only claims below.
-- ============================================================
create table if not exists public.inventory_units (
  id                   uuid primary key default gen_random_uuid(),
  project_id           uuid not null references public.projects(id),
  unit_label           text,
  tower_block          text,
  floor                integer,
  configuration        text,
  bedrooms             integer,
  bathrooms            integer,
  carpet_area_sqft     numeric,
  built_up_area_sqft   numeric,
  price                numeric,
  price_display        text,
  freshness_policy_key text not null default 'standard'
                         references public.inventory_freshness_policies(policy_key),
  note                 text,
  created_by           uuid references public.profiles(id),
  deleted_at           timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint inventory_units_bedrooms_check   check (bedrooms is null or bedrooms >= 0),
  constraint inventory_units_bathrooms_check  check (bathrooms is null or bathrooms >= 0),
  constraint inventory_units_carpet_check     check (carpet_area_sqft is null or carpet_area_sqft > 0),
  constraint inventory_units_builtup_check    check (built_up_area_sqft is null or built_up_area_sqft > 0),
  constraint inventory_units_price_check      check (price is null or price >= 0)
);

comment on table public.inventory_units is
  'Unit-level inventory. Availability is NOT stored here — it is derived from unit_availability_claims by the inventory_units_effective view, so a unit cannot silently remain available forever.';

create unique index if not exists inventory_units_project_label_key
  on public.inventory_units (project_id, unit_label)
  where unit_label is not null and deleted_at is null;
create index if not exists inventory_units_project_id_idx on public.inventory_units (project_id);
create index if not exists inventory_units_freshness_idx  on public.inventory_units (freshness_policy_key);

-- ============================================================
-- 3. unit_availability_claims — APPEND-ONLY
-- Availability is a CLAIM by a party at a point in time, never a fact.
-- 'stale' is intentionally NOT a claimed_state: nobody claims staleness,
-- it is computed from claimed_at against the freshness policy (J8).
-- ============================================================
create table if not exists public.unit_availability_claims (
  id                  uuid primary key default gen_random_uuid(),
  unit_id             uuid not null references public.inventory_units(id),
  claimant_party_id   uuid not null references public.source_parties(id),
  -- Snapshotted at claim time so the claim stays self-describing and
  -- interpretable even if precedence policy changes later. Current-state
  -- derivation reads the live policy table, so policy changes affect present
  -- conclusions without rewriting history.
  claimant_party_type text not null,
  precedence_rank     integer not null,
  claimed_state       text not null,
  claimed_at          timestamptz not null default now(),
  recorded_by         uuid references public.profiles(id),
  evidence_ref        text,
  note                text,
  created_at          timestamptz not null default now(),
  constraint unit_availability_claims_state_check
    check (claimed_state in ('unknown', 'available', 'hold', 'reserved', 'sold', 'unavailable')),
  constraint unit_availability_claims_rank_check
    check (precedence_rank > 0)
);

comment on table public.unit_availability_claims is
  'APPEND-ONLY. Each row is one partys assertion about one units availability at one point in time. Corrections are new claims; rows are never updated or deleted. No UPDATE or DELETE policy exists for any role, including super_admin.';

-- Covering index for the J8 derivation: winner is lowest precedence_rank,
-- then most recent claimed_at.
create index if not exists unit_availability_claims_derivation_idx
  on public.unit_availability_claims (unit_id, precedence_rank asc, claimed_at desc);
create index if not exists unit_availability_claims_party_idx
  on public.unit_availability_claims (claimant_party_id);

-- claimed_at must not be future-dated: back/forward-dating a claim would let
-- a lower-precedence party win a recency tie. Implemented as a trigger, not a
-- CHECK, because now() is not IMMUTABLE and a CHECK using it can fail on
-- dump/restore.
create or replace function public.enforce_claim_not_future_dated()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.claimed_at > now() then
    raise exception 'unit_availability_claims.claimed_at cannot be in the future (got %)', new.claimed_at;
  end if;
  return new;
end;
$$;

drop trigger if exists unit_availability_claims_not_future on public.unit_availability_claims;
create trigger unit_availability_claims_not_future
  before insert on public.unit_availability_claims
  for each row execute function public.enforce_claim_not_future_dated();

-- ------------------------------------------------------------
-- CLAIM SNAPSHOT INTEGRITY (cross-table invariant)
--
-- claimant_party_type and precedence_rank are snapshotted onto each claim so
-- the claim stays self-describing forever. That snapshot is only trustworthy
-- if it was TRUE AT THE MOMENT OF INSERT — otherwise a caller could simply
-- supply precedence_rank = 1 and outrank the developer.
--
-- On INSERT this trigger requires:
--   claimant_party_type = the party's actual source_parties.party_type
--   precedence_rank     = the CURRENT rank in source_party_precedence
--                         for that party type
--
-- BEFORE INSERT ONLY, by design. Historical claims are never rewritten: if
-- precedence policy later changes, existing claims keep the rank that was
-- correct when they were made, while the J8 view derives present-day
-- conclusions from the live policy table. History stays interpretable as it
-- stood; current answers follow current policy.
--
-- SECURITY DEFINER for the same reason as the role/party trigger above.
-- ------------------------------------------------------------
create or replace function public.enforce_claim_snapshot_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_party_type    text;
  v_current_rank  integer;
begin
  select sp.party_type into v_party_type
  from public.source_parties sp
  where sp.id = new.claimant_party_id;

  if v_party_type is null then
    raise exception
      'unit_availability_claims.claimant_party_id % does not resolve to a source_parties row',
      new.claimant_party_id;
  end if;

  if new.claimant_party_type is distinct from v_party_type then
    raise exception
      'claimant_party_type % does not match the actual party type % for party %',
      new.claimant_party_type, v_party_type, new.claimant_party_id;
  end if;

  select spp.precedence_rank into v_current_rank
  from public.source_party_precedence spp
  where spp.party_type = v_party_type;

  if v_current_rank is null then
    raise exception
      'no precedence_rank is configured for party_type %', v_party_type;
  end if;

  if new.precedence_rank is distinct from v_current_rank then
    raise exception
      'precedence_rank % does not match the current rank % for party_type % — precedence may not be fabricated by the caller',
      new.precedence_rank, v_current_rank, v_party_type;
  end if;

  return new;
end;
$$;

comment on function public.enforce_claim_snapshot_integrity() is
  'Validates the party_type and precedence_rank snapshot on a new availability claim against live reference data, so a caller cannot fabricate a higher precedence. INSERT only — historical claims are never rewritten when precedence policy changes.';

drop trigger if exists unit_availability_claims_snapshot_integrity on public.unit_availability_claims;
create trigger unit_availability_claims_snapshot_integrity
  before insert on public.unit_availability_claims
  for each row execute function public.enforce_claim_snapshot_integrity();

-- ============================================================
-- RLS — enabled before any grant. Admin only in Stage 1.
-- NO anon policy anywhere (locked decision 8).
--
-- NO TABLE IN THIS MIGRATION GETS A DELETE POLICY, for ANY role including
-- super_admin. unit_availability_claims additionally gets NO UPDATE policy.
-- Immutability is enforced by policy absence, the same idiom already proven
-- on audit_log and site_visits.
--
-- inventory_units is granted SELECT / INSERT / UPDATE as three explicit
-- policies rather than FOR ALL. FOR ALL would have silently included DELETE,
-- contradicting the table's own deleted_at column and the no-hard-delete
-- principle. Retiring a unit means setting deleted_at; the J8 view already
-- filters on it. Writing the three commands out is what makes the absence of
-- DELETE visible and reviewable in pg_policies.
--
-- project_sources DOES get admin UPDATE, because review/supersession must be
-- possible; the provenance trigger above restricts which columns may change.
-- ============================================================
alter table public.project_sources          enable row level security;
alter table public.inventory_units          enable row level security;
alter table public.unit_availability_claims enable row level security;

drop policy if exists project_sources_admin_select on public.project_sources;
create policy project_sources_admin_select
  on public.project_sources for select
  to authenticated
  using (public.is_super_admin());

drop policy if exists project_sources_admin_insert on public.project_sources;
create policy project_sources_admin_insert
  on public.project_sources for insert
  to authenticated
  with check (public.is_super_admin());

drop policy if exists project_sources_admin_update on public.project_sources;
create policy project_sources_admin_update
  on public.project_sources for update
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());
-- Deliberately no DELETE policy: provenance is never deleted.

-- Dropped unconditionally: an earlier draft of this migration used a FOR ALL
-- policy of this name. Keeping the drop makes the file safe to re-run and
-- guarantees the DELETE capability cannot survive from a prior application.
drop policy if exists inventory_units_admin_all on public.inventory_units;

drop policy if exists inventory_units_admin_select on public.inventory_units;
create policy inventory_units_admin_select
  on public.inventory_units for select
  to authenticated
  using (public.is_super_admin());

drop policy if exists inventory_units_admin_insert on public.inventory_units;
create policy inventory_units_admin_insert
  on public.inventory_units for insert
  to authenticated
  with check (public.is_super_admin());

drop policy if exists inventory_units_admin_update on public.inventory_units;
create policy inventory_units_admin_update
  on public.inventory_units for update
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());
-- Deliberately no DELETE policy: units are retired via deleted_at, never removed.

drop policy if exists unit_availability_claims_admin_select on public.unit_availability_claims;
create policy unit_availability_claims_admin_select
  on public.unit_availability_claims for select
  to authenticated
  using (public.is_super_admin());

drop policy if exists unit_availability_claims_admin_insert on public.unit_availability_claims;
create policy unit_availability_claims_admin_insert
  on public.unit_availability_claims for insert
  to authenticated
  with check (public.is_super_admin());
-- Deliberately no UPDATE and no DELETE policy for any role.

-- ============================================================
-- Triggers
-- ============================================================
drop trigger if exists project_sources_audit on public.project_sources;
create trigger project_sources_audit
  after insert or update or delete on public.project_sources
  for each row execute function public.log_audit_event();

drop trigger if exists inventory_units_set_updated_at on public.inventory_units;
create trigger inventory_units_set_updated_at
  before update on public.inventory_units
  for each row execute function public.set_updated_at();

drop trigger if exists inventory_units_audit on public.inventory_units;
create trigger inventory_units_audit
  after insert or update or delete on public.inventory_units
  for each row execute function public.log_audit_event();

drop trigger if exists unit_availability_claims_audit on public.unit_availability_claims;
create trigger unit_availability_claims_audit
  after insert or update or delete on public.unit_availability_claims
  for each row execute function public.log_audit_event();
