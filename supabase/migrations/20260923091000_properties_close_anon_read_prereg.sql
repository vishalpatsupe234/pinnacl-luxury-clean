-- Pinnacl Properties — pre-registration posture
-- properties: withdraw the anonymous grant from properties_public_read_approved
--
-- ############################################################
-- THIS IS TEMPORARY. IT IS EXPECTED TO BE REVERSED.
--
-- Pinnacl's MahaRERA real estate agent registration number has not yet been
-- issued. While that is true, the public site already refuses to act as a
-- property marketing surface at the application layer
-- (lib/compliance/publicMode.ts): /properties renders a holding notice,
-- /properties/[slug] 404s, the sitemap lists no property URLs, and the
-- homepage suppresses both featured inventory and property search.
--
-- That gate is application-layer only. The DATA layer stayed open: the
-- publishable key ships in the client bundle, so anyone could read approved
-- rows straight from PostgREST —
--   GET /rest/v1/properties?select=*
-- returned the full row, every column, for each approved listing. Row-level
-- security is row-level, never column-level, so source_broker_id, project_id
-- and inventory_unit_id came with it.
--
-- This migration closes that one gap so the data layer matches the posture
-- the application already takes. It is a posture decision by the owner, NOT
-- a legal opinion, and nothing here asserts what the law requires of an
-- applicant awaiting issuance. Whether any particular pre-registration
-- activity is permitted — REQUIRES LAWYER.
--
-- TO REVERSE, AFTER THE REGISTRATION NUMBER IS ISSUED:
--   1. Set NEXT_PUBLIC_MAHARERA_AGENT_REG_NO and deploy, so the application
--      gate opens FIRST and the public pages can render inventory.
--   2. Then apply the companion migration that restores `anon` to the TO
--      list of this same policy.
-- Order matters: restoring this policy alone republishes nothing, but it
-- does reopen direct REST readability before the site is ready to use it.
-- ############################################################

-- ============================================================
-- WHY REPLACE RATHER THAN DROP
--
-- properties_public_read_approved is granted `to anon, authenticated` — one
-- policy serving two roles. A bare DROP would therefore remove the
-- authenticated grant as well, and an authenticated user who is neither an
-- active broker nor a super_admin (a pending_approval or suspended broker, a
-- rejected applicant, a `viewer`) would lose approved-inventory read
-- entirely. No current screen breaks if that happens — /broker/properties is
-- already gated behind active approval — but it is a behaviour change nobody
-- asked for, and it is avoidable.
--
-- So the policy is recreated under the SAME NAME with the SAME predicate and
-- only `anon` removed from the TO list. The name is preserved deliberately:
-- the restore migration re-adds `anon` to this same object, so the catalog
-- reads as one policy evolving rather than three unrelated ones.
-- ============================================================

drop policy if exists properties_public_read_approved on public.properties;

create policy properties_public_read_approved
  on public.properties for select
  to authenticated
  using (
    approval_status = 'approved'
    and deleted_at is null
  );

comment on policy properties_public_read_approved on public.properties is
  'TEMPORARY pre-registration posture: approved, non-deleted inventory is readable by authenticated sessions only. The anon grant was withdrawn while the MahaRERA agent registration number is unissued. Restore it by re-adding anon to the TO list once registration is issued and NEXT_PUBLIC_MAHARERA_AGENT_REG_NO is deployed. The predicate itself is unchanged.';

-- ============================================================
-- DELIBERATELY UNTOUCHED — recorded so the full picture is in one place.
-- This migration must not alter any of the following, and does not:
--
--   properties_broker_read_own       SELECT · authenticated
--                                    source_broker_id = auth.uid()
--   properties_broker_read_approved  SELECT · authenticated
--                                    is_active_broker() and approved and live
--   properties_admin_full_access     ALL    · authenticated
--                                    is_super_admin()
--
-- Admin is unaffected: properties_admin_full_access is FOR ALL, which covers
-- SELECT independently. Active brokers are unaffected: properties_broker_
-- read_approved grants exactly the same rows, and properties_broker_read_own
-- still exposes their own source records at any status. RLS policies are
-- permissive and OR'd, so narrowing one grant cannot narrow another.
--
-- No table schema is altered. No row is inserted, updated or deleted. No
-- other policy is created, dropped or modified. RLS remains enabled on
-- public.properties; this migration does not touch that setting.
-- ============================================================

-- ============================================================
-- APPLICATION DEPENDENCY — ALREADY RESOLVED, DO NOT REGRESS
--
-- POST /api/leads resolves a property slug to properties.id so a website
-- enquiry can be attributed. That lookup used to run on the ANONYMOUS server
-- client and would have started returning null the moment this migration
-- applied — silently, because it fails soft and the lead still inserts with
-- property_id = null. Every enquiry would have lost its property link with
-- no error anywhere.
--
-- app/api/leads/route.ts now performs that one lookup with the service-role
-- client and restates this policy's predicate explicitly in the query
-- (select id, exact slug, approval_status = 'approved', deleted_at is null),
-- because the service role bypasses RLS and would otherwise widen the read.
--
-- If that change is ever reverted, revert this migration too, or lead
-- attribution breaks without a single log line.
-- ============================================================
