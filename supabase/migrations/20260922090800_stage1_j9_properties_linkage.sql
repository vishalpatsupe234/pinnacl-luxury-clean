-- Pinnacl Properties — STAGE 1 / J9
-- Additive linkage columns on the existing properties table
--
-- Locked decision 5: properties is NOT renamed, dropped or repointed. All
-- four existing foreign keys into properties.id (leads, site_visits, deals,
-- commission_ledger) continue to resolve untouched, and properties remains
-- authoritative for the public surface through Stage 2.
--
-- Locked decision 7 / no backfill: every existing row is left at the default
-- migration_state 'unmapped'. Nothing is mapped, nothing is excluded,
-- nothing is written by this migration.
--
-- WHAT "NO ROW MODIFICATION" MEANS PRECISELY:
-- All three columns are added without a table rewrite. project_id and
-- inventory_unit_id are nullable with no default. migration_state is NOT NULL
-- with a CONSTANT default, which PostgreSQL 11+ stores in the catalog rather
-- than writing to every row. So the three live rows will READ BACK as
-- 'unmapped' while no row is physically rewritten and no UPDATE is issued.
--
-- ALTER TABLE does not fire row-level triggers, so properties_audit does not
-- run and public.audit_log gains no rows from this migration.

alter table public.properties
  add column if not exists project_id        uuid references public.projects(id),
  add column if not exists inventory_unit_id uuid references public.inventory_units(id),
  add column if not exists migration_state   text not null default 'unmapped';

-- Re-runnable: drop before add, since ADD CONSTRAINT has no IF NOT EXISTS.
alter table public.properties
  drop constraint if exists properties_migration_state_check;

alter table public.properties
  add constraint properties_migration_state_check
    check (migration_state in ('unmapped', 'mapped', 'needs_manual_mapping', 'excluded'));

comment on column public.properties.project_id is
  'Stage 1 linkage to the canonical projects table. Nullable and unmapped by default: no automatic mapping is performed. Populating this is deliberate Stage 1b manual work.';
comment on column public.properties.inventory_unit_id is
  'Stage 1 linkage to inventory_units. A single legacy properties row conflates project and unit, so splitting it requires human judgement.';
comment on column public.properties.migration_state is
  'unmapped (default) | mapped | needs_manual_mapping | excluded. The two soft-deleted test rows are expected to become excluded during Stage 1b — excluded means never migrated, never deleted.';

create index if not exists properties_project_id_idx        on public.properties (project_id);
create index if not exists properties_inventory_unit_id_idx on public.properties (inventory_unit_id);
create index if not exists properties_migration_state_idx   on public.properties (migration_state);

-- No RLS change. The four existing policies on public.properties
--   properties_admin_full_access
--   properties_broker_read_approved   (Stage 0)
--   properties_broker_read_own
--   properties_public_read_approved
-- already govern this table and are intentionally left exactly as they are.
-- Stage 0 controls and pre-registration public mode remain unchanged.
