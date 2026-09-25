-- Pinnacl Properties — Lead Management CRM (Phase 4)
--
-- `leads` and `site_visits` already exist (original Curated Broker
-- Network migration) with RLS that already satisfies this phase's
-- access rule — verified, not changed:
--   leads_broker_read_assigned / leads_broker_update_assigned:
--     using (assigned_broker_id = auth.uid() or is_super_admin())
--     with check (assigned_broker_id = auth.uid() or is_super_admin())
--   This means: admin has full read/write access to every lead;
--   a broker can only see/update leads assigned to them; and a
--   broker cannot reassign a lead away from themselves via UPDATE,
--   since the WITH CHECK still pins assigned_broker_id to their own
--   auth.uid() — only admin can actually change who a lead is
--   assigned to. "Admin: full access / Broker: only assigned
--   leads" and "Assign broker" as an admin-only action are both
--   already enforced by this existing policy pair.
--   leads_public_insert already lets anyone (including an admin's
--   own session) create a lead.
--
-- This migration therefore only:
--   1. Updates the leads.status pipeline to the new 7-stage spec
--      (previously 6 stages with different names/granularity).
--   2. Adds the genuinely new lead_notes table for broker/admin
--      follow-up notes.
--
-- site_visits is intentionally left untouched — its existing
-- append-only design (insert-your-own, read-own-or-admin, no
-- update/delete for anyone) already matches this phase's needs;
-- no UI in this phase writes to it yet.

-- ============================================================
-- 1. leads.status: New -> Contacted -> Qualified -> Site Visit ->
--    Negotiation -> Closed -> Lost
-- ============================================================
alter table public.leads
  drop constraint if exists leads_status_check;

alter table public.leads
  add constraint leads_status_check
  check (status in ('new', 'contacted', 'qualified', 'site_visit', 'negotiation', 'closed', 'lost'));

comment on column public.leads.status is
  'Pipeline stage: new -> contacted -> qualified -> site_visit -> negotiation -> closed -> lost. Renamed/expanded from the original 6-value enum (no live data existed to migrate — see CLAUDE.md environment note).';

-- ============================================================
-- 2. lead_notes
-- Follow-up / call notes on a lead. Append-only, like the other
-- history tables in this schema (site_visits, audit_log) — no
-- UPDATE/DELETE policy is granted to any role, including admin,
-- so a note can never be silently altered after the fact.
-- ============================================================
create table public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id),
  author_id uuid not null references public.profiles(id),
  note text not null,
  created_at timestamptz not null default now()
);

comment on table public.lead_notes is
  'Append-only follow-up notes on a lead. No UPDATE/DELETE policy exists for any role, including super_admin.';

create index lead_notes_lead_id_idx on public.lead_notes (lead_id);
create index lead_notes_author_id_idx on public.lead_notes (author_id);
create index lead_notes_created_at_idx on public.lead_notes (created_at);

-- Reuse the existing generic audit trigger for consistency with
-- every other mutable table in this schema.
create trigger lead_notes_audit
  after insert on public.lead_notes
  for each row execute function public.log_audit_event();

-- ============================================================
-- RLS: lead_notes
-- ============================================================
alter table public.lead_notes enable row level security;

create policy lead_notes_broker_insert_own_lead
  on public.lead_notes for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.leads
      where leads.id = lead_id
        and leads.assigned_broker_id = auth.uid()
    )
  );

create policy lead_notes_broker_read_own_lead
  on public.lead_notes for select
  to authenticated
  using (
    exists (
      select 1 from public.leads
      where leads.id = lead_id
        and leads.assigned_broker_id = auth.uid()
    )
  );

create policy lead_notes_admin_full_read
  on public.lead_notes for select
  to authenticated
  using (public.is_super_admin());

create policy lead_notes_admin_insert
  on public.lead_notes for insert
  to authenticated
  with check (public.is_super_admin() and author_id = auth.uid());

-- Deliberately no UPDATE or DELETE policy for any role — notes are
-- immutable once written, consistent with site_visits/audit_log.
