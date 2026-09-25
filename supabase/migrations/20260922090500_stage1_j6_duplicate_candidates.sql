-- Pinnacl Properties — STAGE 1 / J6
-- project_duplicate_candidates + detection function
--
-- Locked decision 2 (pg_trgm): NOT installed in Stage 1. Detection uses only
-- two signals, both of which work with no extension:
--   rera_exact  — same non-null rera_project_reg_no          (confidence 0.95)
--   name_city   — same normalised_name AND same city         (confidence 0.75)
-- Similarity/trigram detection may be added later as its own migration.
--
-- DETECTION IS AUTOMATED. MERGE IS MANUAL, ALWAYS.
-- Nothing in this file merges, deletes, archives or rewrites a project. The
-- function only raises candidates in review_state 'open' for a human.

create table if not exists public.project_duplicate_candidates (
  id               uuid primary key default gen_random_uuid(),
  project_a_id     uuid not null references public.projects(id),
  project_b_id     uuid not null references public.projects(id),
  confidence       numeric not null,
  signals          jsonb not null default '{}'::jsonb,
  detection_method text not null,
  review_state     text not null default 'open',
  reviewed_by      uuid references public.profiles(id),
  reviewed_at      timestamptz,
  resolution_note  text,
  created_at       timestamptz not null default now(),
  -- Canonical ordering prevents the same pair being stored as both (A,B)
  -- and (B,A).
  constraint project_duplicate_candidates_order_check
    check (project_a_id < project_b_id),
  constraint project_duplicate_candidates_confidence_check
    check (confidence >= 0 and confidence <= 1),
  constraint project_duplicate_candidates_method_check
    check (detection_method in ('rera_exact', 'name_city')),
  constraint project_duplicate_candidates_review_state_check
    check (review_state in ('open', 'merged', 'distinct', 'dismissed'))
);

comment on table public.project_duplicate_candidates is
  'Possible duplicate project pairs raised by detection. A candidate is never actioned automatically: merging is a manual admin decision, and a merge sets projects.merged_into_id rather than deleting a row.';

create unique index if not exists project_duplicate_candidates_pair_key
  on public.project_duplicate_candidates (project_a_id, project_b_id);
create index if not exists project_duplicate_candidates_review_state_idx
  on public.project_duplicate_candidates (review_state);

-- ============================================================
-- Detection function
--
-- SECURITY INVOKER (the default, stated explicitly): RLS applies as the
-- calling user, so only an admin can read projects and therefore only an
-- admin can produce candidates. A SECURITY DEFINER function here would
-- silently bypass RLS.
--
-- The explicit is_super_admin() guard makes admin-only access fail loudly
-- rather than silently returning 0 for a caller RLS hides every row from.
-- It also refuses callers with no auth.uid() (service_role, SQL Editor):
-- detection is run by a signed-in super_admin.
--
-- Returns the number of new candidates inserted.
-- ============================================================
create or replace function public.detect_project_duplicates()
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_rera integer := 0;
  v_name integer := 0;
begin
  if not public.is_super_admin() then
    raise exception 'admin access required';
  end if;

  -- Signal 1: identical non-null RERA registration number.
  -- In practice the partial unique index projects_rera_project_reg_no_key
  -- already prevents two live projects sharing a number, so this branch
  -- normally finds nothing. It is retained to catch cases the index cannot
  -- see — most plausibly a soft-deleted project later restored, since that
  -- index is filtered on deleted_at is null.
  insert into public.project_duplicate_candidates
    (project_a_id, project_b_id, confidence, signals, detection_method)
  select
    least(a.id, b.id),
    greatest(a.id, b.id),
    0.95,
    jsonb_build_object(
      'rera_project_reg_no', a.rera_project_reg_no,
      'signal', 'exact registration number match'
    ),
    'rera_exact'
  from public.projects a
  join public.projects b
    on b.rera_project_reg_no = a.rera_project_reg_no
   and b.id > a.id
  where a.rera_project_reg_no is not null
    and a.deleted_at is null and b.deleted_at is null
    and a.merged_into_id is null and b.merged_into_id is null
  on conflict (project_a_id, project_b_id) do nothing;

  get diagnostics v_rera = row_count;

  -- Signal 2: identical normalised name AND identical city.
  -- Name alone is deliberately NOT a signal — too weak to act on, and the
  -- approved architecture forbids merging on name similarity alone.
  insert into public.project_duplicate_candidates
    (project_a_id, project_b_id, confidence, signals, detection_method)
  select
    least(a.id, b.id),
    greatest(a.id, b.id),
    0.75,
    jsonb_build_object(
      'normalised_name', a.normalised_name,
      'city', a.city,
      'signal', 'normalised name and city match'
    ),
    'name_city'
  from public.projects a
  join public.projects b
    on b.normalised_name = a.normalised_name
   and lower(coalesce(b.city, '')) = lower(coalesce(a.city, ''))
   and b.id > a.id
  where a.normalised_name <> ''
    and a.deleted_at is null and b.deleted_at is null
    and a.merged_into_id is null and b.merged_into_id is null
  on conflict (project_a_id, project_b_id) do nothing;

  get diagnostics v_name = row_count;

  return v_rera + v_name;
end;
$$;

comment on function public.detect_project_duplicates() is
  'Raises duplicate project candidates using rera_exact and name_city signals only (no pg_trgm in Stage 1). Detection only — never merges, deletes or archives anything.';

-- ============================================================
-- RLS — admin only. Never broker-visible: which projects are suspected
-- duplicates is internal review data. No anon policy (locked decision 8).
--
-- SELECT / INSERT / UPDATE are three explicit policies rather than FOR ALL,
-- for the same reason as inventory_units in J5: FOR ALL would silently
-- include DELETE. A candidate and its review outcome are review history;
-- a resolved candidate changes review_state, it is never removed.
-- ============================================================
alter table public.project_duplicate_candidates enable row level security;

-- Dropped unconditionally: an earlier draft of this migration used a FOR ALL
-- policy of this name. Keeping the drop makes the file safe to re-run and
-- guarantees the DELETE capability cannot survive from a prior application.
drop policy if exists project_duplicate_candidates_admin_all on public.project_duplicate_candidates;

drop policy if exists project_duplicate_candidates_admin_select on public.project_duplicate_candidates;
create policy project_duplicate_candidates_admin_select
  on public.project_duplicate_candidates for select
  to authenticated
  using (public.is_super_admin());

drop policy if exists project_duplicate_candidates_admin_insert on public.project_duplicate_candidates;
create policy project_duplicate_candidates_admin_insert
  on public.project_duplicate_candidates for insert
  to authenticated
  with check (public.is_super_admin());

drop policy if exists project_duplicate_candidates_admin_update on public.project_duplicate_candidates;
create policy project_duplicate_candidates_admin_update
  on public.project_duplicate_candidates for update
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());
-- Deliberately no DELETE policy for any role, including super_admin.

drop trigger if exists project_duplicate_candidates_audit on public.project_duplicate_candidates;
create trigger project_duplicate_candidates_audit
  after insert or update or delete on public.project_duplicate_candidates
  for each row execute function public.log_audit_event();
