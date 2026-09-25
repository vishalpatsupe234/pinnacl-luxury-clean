-- Pinnacl Properties — STAGE 1 / J1
-- Reference tables: source party precedence + inventory freshness policy
--
-- These hold configurable BUSINESS POLICY, not legal requirements and not
-- code constants. Thresholds and ranks live in rows so an admin can change
-- them with an UPDATE — no migration, no deploy. Locked decisions 1 and 2.
--
-- DESIGN NOTE (important, caught in preflight):
-- Both tables carry a surrogate `id uuid` primary key even though they have
-- a natural key. public.log_audit_event() writes coalesce(new.id, old.id),
-- so ANY audited table must expose an `id` column or the trigger fails at
-- runtime on first write. The natural keys (party_type / policy_key) are
-- kept UNIQUE so foreign keys can still reference them directly.
--
-- Re-runnable: create table if not exists + drop-before-create for policies
-- and triggers.

-- ============================================================
-- 1. source_party_precedence
-- Locked decision 1: developer > pinnacl > broker (referrer last).
-- Lower precedence_rank wins when two parties claim the same unit.
-- ============================================================
create table if not exists public.source_party_precedence (
  id              uuid primary key default gen_random_uuid(),
  party_type      text not null,
  precedence_rank integer not null,
  description     text,
  updated_by      uuid references public.profiles(id),
  updated_at      timestamptz not null default now(),
  constraint source_party_precedence_party_type_key unique (party_type),
  constraint source_party_precedence_rank_key       unique (precedence_rank),
  constraint source_party_precedence_type_check
    check (party_type in ('developer', 'pinnacl', 'broker', 'referrer')),
  constraint source_party_precedence_rank_check
    check (precedence_rank > 0)
);

comment on table public.source_party_precedence is
  'Configurable business policy: which source party wins when availability claims conflict. Lower rank wins. Not a legal requirement.';

-- ============================================================
-- 2. inventory_freshness_policies
-- Locked decision 2: 7 / 14 / 30 days as configurable defaults.
-- Consumed by the inventory_units_effective view (J8) to derive staleness
-- at read time. Changing max_age_days re-derives every unit immediately.
-- ============================================================
create table if not exists public.inventory_freshness_policies (
  id           uuid primary key default gen_random_uuid(),
  policy_key   text not null,
  max_age_days integer not null,
  description  text,
  updated_by   uuid references public.profiles(id),
  updated_at   timestamptz not null default now(),
  constraint inventory_freshness_policies_key_unique unique (policy_key),
  constraint inventory_freshness_policies_key_check
    check (policy_key in ('actively_marketed', 'standard', 'long_cycle')),
  constraint inventory_freshness_policies_max_age_check
    check (max_age_days > 0)
);

comment on table public.inventory_freshness_policies is
  'Configurable business policy: how long an availability claim stays fresh before a unit is treated as stale and therefore not publishable. Not a legal requirement.';

-- ============================================================
-- RLS — enabled BEFORE any policy is granted.
-- Locked decision 8: no anon policy on any Stage 1 table.
-- Authenticated SELECT is granted here only because these two tables are
-- non-sensitive lookup data needed to interpret claims; every other Stage 1
-- table is admin-only.
-- ============================================================
alter table public.source_party_precedence     enable row level security;
alter table public.inventory_freshness_policies enable row level security;

drop policy if exists source_party_precedence_admin_all on public.source_party_precedence;
create policy source_party_precedence_admin_all
  on public.source_party_precedence for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists source_party_precedence_read_authenticated on public.source_party_precedence;
create policy source_party_precedence_read_authenticated
  on public.source_party_precedence for select
  to authenticated
  using (true);

drop policy if exists inventory_freshness_policies_admin_all on public.inventory_freshness_policies;
create policy inventory_freshness_policies_admin_all
  on public.inventory_freshness_policies for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists inventory_freshness_policies_read_authenticated on public.inventory_freshness_policies;
create policy inventory_freshness_policies_read_authenticated
  on public.inventory_freshness_policies for select
  to authenticated
  using (true);

-- ============================================================
-- updated_at maintenance — uses the existing public.set_updated_at().
--
-- Both tables carry an updated_at column. Without this trigger the column
-- would keep its insert-time default forever, so editing a precedence rank
-- or a freshness threshold would leave updated_at silently stale — on
-- precisely the two tables where "when was this policy last changed" matters
-- most. The audit trigger below would still record the change, but the
-- column itself would be misleading.
--
-- Consistent with developers, source_parties, projects and inventory_units,
-- which all attach this same trigger.
-- ============================================================
drop trigger if exists source_party_precedence_set_updated_at on public.source_party_precedence;
create trigger source_party_precedence_set_updated_at
  before update on public.source_party_precedence
  for each row execute function public.set_updated_at();

drop trigger if exists inventory_freshness_policies_set_updated_at on public.inventory_freshness_policies;
create trigger inventory_freshness_policies_set_updated_at
  before update on public.inventory_freshness_policies
  for each row execute function public.set_updated_at();

-- ============================================================
-- Audit — uses the existing public.log_audit_event() unchanged.
-- Policy changes are commercially material and must be attributable.
-- ============================================================
drop trigger if exists source_party_precedence_audit on public.source_party_precedence;
create trigger source_party_precedence_audit
  after insert or update or delete on public.source_party_precedence
  for each row execute function public.log_audit_event();

drop trigger if exists inventory_freshness_policies_audit on public.inventory_freshness_policies;
create trigger inventory_freshness_policies_audit
  after insert or update or delete on public.inventory_freshness_policies
  for each row execute function public.log_audit_event();
