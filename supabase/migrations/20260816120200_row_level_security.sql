-- Pinnacl Properties — Curated Broker Network
-- Migration 3 of 3: Row Level Security
--
-- Conventions used throughout:
--   * public.is_super_admin() / public.is_active_broker() are
--     SECURITY DEFINER helpers so policies never query `profiles`
--     recursively through RLS (a common Supabase pitfall).
--   * Tables with no UPDATE/DELETE policy for any role are
--     immutable by construction — Postgres RLS denies any
--     operation that has no matching policy.

-- ============================================================
-- Helper functions
-- ============================================================
create or replace function public.is_super_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select role = 'super_admin' from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.is_active_broker()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select role in ('verified_broker', 'sales_partner') and status = 'active'
       from public.profiles where id = auth.uid()),
    false
  );
$$;

-- ============================================================
-- 1. profiles
-- ============================================================
alter table public.profiles enable row level security;

create policy profiles_select_own_or_admin
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_super_admin());

create policy profiles_update_own
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
  -- role-change protection is enforced by the
  -- profiles_role_change_admin_only trigger (migration 1), not
  -- by this policy, to avoid a self-referential RLS subquery.

create policy profiles_admin_full_access
  on public.profiles for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- No INSERT policy exists for any client role: profile rows are
-- created only via the Supabase Auth Admin API / a service-role
-- server action as part of the invite workflow, never by client
-- self-registration.

-- ============================================================
-- 2. builders
-- ============================================================
alter table public.builders enable row level security;

create policy builders_read_verified_authenticated
  on public.builders for select
  to authenticated
  using (verification_status = 'verified' or public.is_super_admin());

create policy builders_read_verified_public
  on public.builders for select
  to anon
  using (verification_status = 'verified');

create policy builders_admin_write
  on public.builders for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- ============================================================
-- 3. properties
-- ============================================================
alter table public.properties enable row level security;

create policy properties_public_read_approved
  on public.properties for select
  to anon, authenticated
  using (approval_status = 'approved' and deleted_at is null);

create policy properties_broker_read_own
  on public.properties for select
  to authenticated
  using (source_broker_id = auth.uid());

create policy properties_broker_insert_own
  on public.properties for insert
  to authenticated
  with check (public.is_active_broker() and source_broker_id = auth.uid());

create policy properties_broker_update_own_pending
  on public.properties for update
  to authenticated
  using (source_broker_id = auth.uid() and approval_status = 'pending_review')
  with check (source_broker_id = auth.uid() and approval_status = 'pending_review');
  -- a broker can edit their own listing's content only while it
  -- is still pending review, and this policy cannot itself be
  -- used to flip approval_status away from pending_review —
  -- only the admin policy below can approve/reject a listing

create policy properties_admin_full_access
  on public.properties for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- No DELETE policy for any non-admin role — deletion is expected
-- to be a soft delete (set deleted_at via UPDATE), never a hard
-- DELETE. See CLAUDE.md: "no hard delete."

-- ============================================================
-- 4. leads
-- ============================================================
alter table public.leads enable row level security;

create policy leads_public_insert
  on public.leads for insert
  to anon, authenticated
  with check (true);
  -- anyone can submit an enquiry — this is the public lead form

create policy leads_broker_read_assigned
  on public.leads for select
  to authenticated
  using (assigned_broker_id = auth.uid() or public.is_super_admin());

create policy leads_broker_update_assigned
  on public.leads for update
  to authenticated
  using (assigned_broker_id = auth.uid() or public.is_super_admin())
  with check (assigned_broker_id = auth.uid() or public.is_super_admin());

-- No public SELECT policy: a submitted enquiry is never readable
-- by the submitter, only by the assigned broker and admin.

-- ============================================================
-- 5. site_visits — append-only, immutable
-- ============================================================
alter table public.site_visits enable row level security;

create policy site_visits_broker_insert_own
  on public.site_visits for insert
  to authenticated
  with check (broker_id = auth.uid());

create policy site_visits_read_own_or_admin
  on public.site_visits for select
  to authenticated
  using (broker_id = auth.uid() or public.is_super_admin());

-- Deliberately no UPDATE or DELETE policy on this table for any
-- role — see CLAUDE.md: site visits are immutable history.

-- ============================================================
-- 6. deals
-- ============================================================
alter table public.deals enable row level security;

create policy deals_read_own_or_admin
  on public.deals for select
  to authenticated
  using (
    source_broker_id = auth.uid()
    or closing_broker_id = auth.uid()
    or public.is_super_admin()
  );

create policy deals_broker_insert
  on public.deals for insert
  to authenticated
  with check (
    public.is_active_broker()
    and (source_broker_id = auth.uid() or closing_broker_id = auth.uid())
  );

create policy deals_admin_verify
  on public.deals for update
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());
  -- only admin can progress verification_status — see CLAUDE.md:
  -- "Admin verifies deal"

-- ============================================================
-- 7. commission_ledger — brokers see only their own earnings
-- ============================================================
alter table public.commission_ledger enable row level security;

create policy commission_ledger_broker_read_own
  on public.commission_ledger for select
  to authenticated
  using (source_broker_id = auth.uid() or closing_broker_id = auth.uid());

create policy commission_ledger_admin_full_access
  on public.commission_ledger for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- No broker INSERT/UPDATE/DELETE policy exists: ledger entries
-- are created and progressed (pending -> verified -> released)
-- only by admin. Brokers are read-only on their own rows — see
-- CLAUDE.md: "brokers can see only their own earnings."

-- ============================================================
-- 8. audit_log — admin read-only, no client writes, immutable
-- ============================================================
alter table public.audit_log enable row level security;

create policy audit_log_admin_read_only
  on public.audit_log for select
  to authenticated
  using (public.is_super_admin());

-- No INSERT/UPDATE/DELETE policy exists for any role, including
-- super_admin. Rows are written exclusively by the SECURITY
-- DEFINER log_audit_event() trigger function (migration 2), which
-- runs with elevated privilege independent of RLS. This is what
-- makes "audit trail cannot be edited" a real, enforced guarantee
-- rather than a documented intention.
