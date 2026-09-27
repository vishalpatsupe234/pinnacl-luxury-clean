-- Pinnacl Properties — security remediation
-- leads: require an ACTIVE broker, not merely a matching auth.uid()
--
-- ############################################################
-- FINDING R2 — suspended/rejected broker retained data-layer access.
--
-- leads_broker_read_assigned and leads_broker_update_assigned tested
-- IDENTITY ONLY:
--
--     using (assigned_broker_id = auth.uid() or public.is_super_admin())
--
-- They never asked whether that identity was still an ELIGIBLE broker.
-- The application enforces the real rule in three places — the broker page
-- guards check role and status = 'active', and the broker API checks
-- isActiveBroker — but those are application code. A suspended or rejected
-- broker holding a still-valid session could bypass all of them by calling
-- PostgREST directly with the publishable key, because the DATABASE had no
-- opinion about their status.
--
-- This migration closes that gap by adding public.is_active_broker() to the
-- broker arm of both policies. The intended business rule becomes fully
-- enforced at the data layer:
--
--     role in ('verified_broker','sales_partner')
--     AND status = 'active'
--     AND assigned_broker_id = auth.uid()
--
-- ############################################################

-- ============================================================
-- WHY THIS PATTERN, AND WHY THE PARENTHESES MATTER
--
-- This mirrors properties_broker_read_approved from Stage 0
-- (20260921090000_broker_property_scope_stage0.sql), which has gated on
-- public.is_active_broker() since 2026-09-21 without issue.
--
-- One structural difference from that policy: the properties one is a pure
-- capability grant, so is_active_broker() is its only condition. The leads
-- policies are OWNERSHIP-SCOPED and must additionally carry the super_admin
-- arm, because admin access to leads flows through these same two policies
-- rather than through a separate admin policy.
--
-- Hence the grouped form below. The parentheses are load-bearing for the
-- reader: `and` binds tighter than `or`, so the expression would parse the
-- same way without them, but the grouping makes the two arms unambiguous —
--     (active broker AND owns the row)  OR  (super_admin)
--
-- public.is_active_broker() is reused unchanged. It is SECURITY DEFINER so it
-- can read public.profiles regardless of the caller's own RLS visibility, it
-- returns a boolean and never a row, its search_path is pinned to public, and
-- it coalesces to false — so a missing profile, a NULL auth.uid() or an
-- anonymous caller all fail closed. It reads profiles, not leads, so adding
-- it to a leads policy creates no recursion. It is marked stable, so Postgres
-- evaluates it once per statement rather than once per row.
--
-- NO NEW FUNCTION IS CREATED HERE. is_active_broker() and is_super_admin()
-- are used exactly as they already exist.
-- ============================================================

-- ============================================================
-- DELIBERATELY NOT CHANGED
--
--   leads_public_insert  — anonymous enquiry submission is untouched. The
--                          public lead funnel keeps working exactly as before.
--   super_admin access   — the `or public.is_super_admin()` arm is preserved
--                          verbatim on both policies. is_super_admin() ignores
--                          status entirely, so admin access cannot be lost.
--   DELETE               — no DELETE policy exists on public.leads for any
--                          role, and none is added. Hard deletion remains
--                          impossible through the API; archive is deleted_at.
--   policy names         — preserved, so the catalog reads as two policies
--                          evolving rather than four unrelated ones.
--   lead_notes           — NOT modified, and deliberately so. Its broker
--                          policies gate on an EXISTS subquery against
--                          public.leads, which is itself subject to leads RLS
--                          for the calling role. Tightening leads therefore
--                          closes the identical R2 gap on lead_notes
--                          automatically. A separate lead_notes policy change
--                          would be redundant.
--   rows / columns       — nothing is inserted, updated or deleted. No schema
--                          change. assigned_broker_id is untouched, so every
--                          lead stays assigned to whoever holds it today and
--                          no reassignment is required.
--
-- Drop-before-create is used because CREATE POLICY has no IF NOT EXISTS form;
-- this also makes the migration safe to re-run.
-- ============================================================

-- ============================================================
-- 1. SELECT
-- ============================================================
drop policy if exists leads_broker_read_assigned on public.leads;

create policy leads_broker_read_assigned
  on public.leads for select
  to authenticated
  using (
    (public.is_active_broker() and assigned_broker_id = auth.uid())
    or public.is_super_admin()
  );

comment on policy leads_broker_read_assigned on public.leads is
  'Active brokers read their own assigned leads; super_admin reads all. The is_active_broker() term closes R2: a suspended or rejected broker no longer retains database-layer read access through a still-valid session. Also closes the same gap on lead_notes, whose broker read policy resolves through a subquery against this table.';

-- ============================================================
-- 2. UPDATE
--
-- The condition is repeated in WITH CHECK, not just USING, for two reasons:
--   * USING decides which existing rows are updatable; WITH CHECK validates
--     the RESULTING row. Without it, a caller who passes USING could write a
--     row that violates the rule.
--   * It is what already prevents a broker reassigning a lead away from
--     themselves — the new row must still satisfy assigned_broker_id =
--     auth.uid(). That existing protection is preserved exactly.
-- ============================================================
drop policy if exists leads_broker_update_assigned on public.leads;

create policy leads_broker_update_assigned
  on public.leads for update
  to authenticated
  using (
    (public.is_active_broker() and assigned_broker_id = auth.uid())
    or public.is_super_admin()
  )
  with check (
    (public.is_active_broker() and assigned_broker_id = auth.uid())
    or public.is_super_admin()
  );

comment on policy leads_broker_update_assigned on public.leads is
  'Active brokers update their own assigned leads; super_admin updates all. WITH CHECK repeats the condition so a broker still cannot reassign a lead away from themselves, and a suspended or rejected broker cannot write at all. Note this remains row-level: an ACTIVE broker can still write any column on a lead assigned to them (finding R1), which a policy cannot restrict — that would require a column-guard trigger and is not addressed here.';

-- ============================================================
-- ROLLBACK (for reference — not executed by this migration)
--
--   drop policy if exists leads_broker_read_assigned on public.leads;
--   create policy leads_broker_read_assigned
--     on public.leads for select to authenticated
--     using (assigned_broker_id = auth.uid() or public.is_super_admin());
--
--   drop policy if exists leads_broker_update_assigned on public.leads;
--   create policy leads_broker_update_assigned
--     on public.leads for update to authenticated
--     using (assigned_broker_id = auth.uid() or public.is_super_admin())
--     with check (assigned_broker_id = auth.uid() or public.is_super_admin());
--
-- Restores the definitions from 20260816120200_row_level_security.sql
-- exactly, and reopens R2. Policy definitions only — no data is touched.
-- ============================================================

-- ============================================================
-- POST-APPLY VERIFICATION (read-only — run separately, not part of this file)
--
--   select policyname, cmd, roles::text
--   from pg_policies where schemaname='public' and tablename='leads'
--   order by policyname;
--   -- expect exactly 3: leads_broker_read_assigned (SELECT),
--   --   leads_broker_update_assigned (UPDATE), leads_public_insert (INSERT)
--
--   select relrowsecurity from pg_class where oid='public.leads'::regclass;
--   -- expect true
--
--   select count(*) from pg_policies
--    where schemaname='public' and tablename='leads' and cmd='DELETE';
--   -- expect 0
--
-- Behavioural, against live sessions:
--   anon                -> 0 rows (unchanged)
--   active broker       -> still sees and can restage their assigned lead
--   suspended broker    -> now 0 rows  <- the decisive test
--   suspended broker    -> 0 rows from lead_notes (confirms the cascade)
--   super_admin         -> all leads still visible
--   public /contact     -> enquiry INSERT still succeeds
--
-- Expected impact on current data (checked read-only, 2026-09-27):
--   2 of 17 leads are assigned. One is assigned to verified_broker/active,
--   which keeps access. One is assigned to verified_broker/suspended, which
--   loses database access — the intended effect, and already blocked in the
--   UI. No active broker loses anything.
-- ============================================================
