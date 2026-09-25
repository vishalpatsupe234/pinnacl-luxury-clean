-- Pinnacl Properties — STAGE 1 / J4
-- projects: canonical project identity
--
-- This is the table that ends the project/unit conflation. A project is an
-- identity (name, developer, registration, location, lifecycle). Unit-level
-- attributes live in inventory_units (J5). The existing `properties` table is
-- untouched and remains authoritative for the public surface.
--
-- CANONICAL KEY: rera_project_reg_no where present, enforced by a PARTIAL
-- unique index. Many projects may legitimately have no number yet; no two
-- live projects may share one.
--
-- NAME SIMILARITY NEVER AUTO-MERGES. Duplicate handling is J6, and every
-- match is a candidate for human review, never an automatic action.
--
-- NO ROWS ARE CREATED HERE. The live Lodha property is not mapped — that is
-- Stage 1b manual work (locked decisions 5, 6, 7).

create table if not exists public.projects (
  id                   uuid primary key default gen_random_uuid(),
  developer_id         uuid references public.developers(id),
  name                 text not null,
  normalised_name      text generated always as (
                         btrim(regexp_replace(lower(name), '[^a-z0-9]+', ' ', 'g'))
                       ) stored,
  rera_project_reg_no  text,
  rera_reg_verified_at timestamptz,
  rera_reg_verified_by uuid references public.profiles(id),
  rera_reg_expires_at  timestamptz,
  city                 text,
  locality             text,
  address              text,
  lifecycle_state      text not null default 'draft',
  -- Set on merge; the losing row is NEVER deleted and its foreign keys are
  -- never rewritten. That is what makes a merge reversible (rollback plan K).
  merged_into_id       uuid references public.projects(id),
  note                 text,
  created_by           uuid references public.profiles(id),
  deleted_at           timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  constraint projects_lifecycle_state_check check (
    lifecycle_state in (
      'draft', 'pending_verification', 'verified',
      'published', 'suspended', 'rejected', 'archived'
    )
  ),

  -- ----------------------------------------------------------
  -- THE PUBLICATION INVARIANT (locked decision 3, hardened)
  -- A project cannot reach 'verified' or 'published' without ALL THREE of:
  --   rera_project_reg_no   — a registration number is on record
  --   rera_reg_verified_at  — a human checked it, at a known time
  --   rera_reg_verified_by  — and that human is identified
  --
  -- Requiring verified_by as well as verified_at is what stops "verified"
  -- becoming a self-asserting flag: there is always an attributable person
  -- behind any project that reaches a publishable state.
  --
  -- This is the control that stops a placeholder value such as the
  -- 'TEST-RERA-001' currently sitting in properties.rera_number from ever
  -- becoming publishable.
  --
  -- Deliberately NO format/regex check: the valid MahaRERA format is
  -- REQUIRES MAHARERA CONFIRMATION, and a guessed pattern would either
  -- reject valid numbers or lend false assurance. Structure, not syntax.
  -- ----------------------------------------------------------
  constraint projects_publication_invariant_check check (
    lifecycle_state not in ('verified', 'published')
    or (
      rera_project_reg_no  is not null
      and rera_reg_verified_at is not null
      and rera_reg_verified_by is not null
    )
  ),

  constraint projects_no_self_merge_check
    check (merged_into_id is null or merged_into_id <> id)
);

comment on table public.projects is
  'Canonical project identity. Separate from inventory_units (configuration) and from project_sources (provenance). Verified and published are distinct states: verification is a factual claim about registration, publication is a commercial decision.';
comment on column public.projects.rera_project_reg_no is
  'Canonical identifier when present. No format validation is applied — REQUIRES MAHARERA CONFIRMATION. The publication invariant requires a human verification timestamp instead.';
comment on column public.projects.merged_into_id is
  'Duplicate resolution pointer. Merging sets this and archives the row; it never deletes the row or rewrites its foreign keys.';

-- Canonical key: partial, so absence is allowed but collision is not.
create unique index if not exists projects_rera_project_reg_no_key
  on public.projects (rera_project_reg_no)
  where rera_project_reg_no is not null and deleted_at is null;

create index if not exists projects_normalised_name_idx on public.projects (normalised_name);
create index if not exists projects_developer_id_idx    on public.projects (developer_id);
create index if not exists projects_lifecycle_state_idx on public.projects (lifecycle_state);
create index if not exists projects_city_locality_idx   on public.projects (city, locality);
create index if not exists projects_merged_into_id_idx  on public.projects (merged_into_id);

-- ============================================================
-- RLS — admin only in Stage 1. NO anon policy (locked decision 8).
-- The broker policy specified in the design
--   (select where lifecycle_state = 'published' and deleted_at is null)
-- is intentionally NOT created: no broker surface consumes it yet, and
-- Stage 1 must not open a second public-facing path while pre-registration
-- mode is active.
-- ============================================================
alter table public.projects enable row level security;

drop policy if exists projects_admin_all on public.projects;
create policy projects_admin_all
  on public.projects for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

drop trigger if exists projects_audit on public.projects;
create trigger projects_audit
  after insert or update or delete on public.projects
  for each row execute function public.log_audit_event();
