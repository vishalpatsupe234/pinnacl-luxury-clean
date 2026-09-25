-- Pinnacl Properties — Stage 0 safety foundation
-- Broker property write-path removal + read-scope narrowing
--
-- Audit finding: the database granted active brokers INSERT and UPDATE on
-- `properties` while no broker submission API or UI exists anywhere in the
-- application (every route under app/api/broker/ is GET-only apart from
-- accept-invite, lead notes and lead status). That is a database-only write
-- path: reachable by any active broker calling PostgREST directly with their
-- own session, with no review workflow, no source declaration and no
-- attribution record attached to it.
--
-- Two options were considered:
--   A. build the broker submission endpoint + UI + pending-review workflow
--   B. remove the unused capability until that workflow exists
-- Option B is taken. Option A is Stage 3 work in the approved architecture
-- (it depends on project_sources, which does not exist yet); building a
-- submission path now would mean brokers submitting into the single
-- `properties` table, which is exactly the creator-equals-source conflation
-- Stage 1 is meant to remove. Removing an unused grant is reversible; the
-- data it would have created is not.
--
-- No property rows are modified by this migration. `properties_broker_*`
-- policies are dropped/recreated by name; no new overlapping policy is
-- introduced.

-- ============================================================
-- 1. Remove the unused broker write paths.
-- Re-add them, scoped, when the Stage 3 submission workflow lands.
-- ============================================================
drop policy if exists properties_broker_insert_own on public.properties;
drop policy if exists properties_broker_update_own_pending on public.properties;

-- ============================================================
-- 2. Narrow broker read scope.
--
-- Was: properties_broker_read_all — using (public.is_active_broker())
-- with no approval_status or deleted_at condition, so any active broker
-- could read every row including pending_review, rejected and soft-deleted
-- properties. RLS policies are OR'd, so this single policy widened the
-- broker's view of the whole table.
--
-- Now: approved, non-deleted inventory only. A broker's own source records
-- at any status remain readable through the untouched
-- properties_broker_read_own policy (source_broker_id = auth.uid()), which
-- is what the Stage 3 submission workflow will rely on.
-- ============================================================
drop policy if exists properties_broker_read_all on public.properties;

-- Dropped first so this migration is safe to re-run: CREATE POLICY has no
-- IF NOT EXISTS form, and a second execution would otherwise fail after the
-- DROPs above had already succeeded.
drop policy if exists properties_broker_read_approved on public.properties;

create policy properties_broker_read_approved
  on public.properties for select
  to authenticated
  using (
    public.is_active_broker()
    and approval_status = 'approved'
    and deleted_at is null
  );

comment on policy properties_broker_read_approved on public.properties is
  'Stage 0: active brokers read approved, non-deleted inventory only. Own source records remain visible via properties_broker_read_own. Replaces properties_broker_read_all, which had no status filter.';

-- ============================================================
-- Unchanged by design, recorded here so the full picture is in one place:
--   properties_public_read_approved  (anon + authenticated, approved & live)
--   properties_broker_read_own       (own source records, any status)
--   properties_admin_full_access     (super_admin, all operations)
-- Brokers therefore cannot approve, reject, publish, change attribution or
-- change ownership: no broker-facing INSERT or UPDATE policy on
-- public.properties exists after this migration, and source_broker_id
-- remains immutable via the enforce_source_broker_immutable trigger.
-- ============================================================
