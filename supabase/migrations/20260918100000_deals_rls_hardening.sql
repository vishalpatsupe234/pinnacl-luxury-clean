-- Pinnacl Properties — Phase 2 Security Hardening
-- deals RLS: close the "fabricate a co-broker" gap
--
-- Original vulnerability (from the security audit): deals_broker_insert
-- required only ONE of source_broker_id/closing_broker_id to equal
-- the inserting broker's own id — the OTHER field could be set to
-- any arbitrary profile id. A broker could insert a deal naming an
-- uninvolved second broker as though they'd participated in a
-- transaction that never happened.
--
-- `deals` has zero application code anywhere in this repository —
-- no route, no admin/broker UI references it (confirmed by a fresh
-- repo-wide grep during this audit) — so this is a live, unused-but-
-- reachable RLS gap, not a change to any working feature.
--
-- Owner-approved direction: a broker may only self-insert a deal
-- where they are attributed as BOTH the source and closing broker
-- (i.e. a deal they originated and closed entirely themselves).
-- Both columns are NOT NULL in the schema (no "or null" option
-- exists), so this is the closest faithful equivalent to "a broker
-- can never nominate an uninvolved second broker" — any deal
-- genuinely involving two different brokers must be created by an
-- admin, who is given a new, separate insert policy below (none
-- existed for admin before this migration — only deals_admin_verify,
-- which is UPDATE-only).

drop policy if exists deals_broker_insert on public.deals;

create policy deals_broker_insert
  on public.deals for insert
  to authenticated
  with check (
    public.is_active_broker()
    and source_broker_id = auth.uid()
    and closing_broker_id = auth.uid()
  );

-- New: admin can insert any deal (previously, no INSERT policy
-- granted this at all — deals_admin_verify only covers UPDATE).
-- Needed so a genuine two-broker deal still has a legitimate path
-- to be recorded, now that a broker can no longer self-insert one.
create policy deals_admin_insert
  on public.deals for insert
  to authenticated
  with check (public.is_super_admin());
