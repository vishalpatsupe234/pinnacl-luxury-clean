-- Pinnacl Properties — STAGE 1 / J2
-- Seed the 7 reference rows (locked decision 1)
--
-- THIS IS THE ONLY INTENTIONAL INSERT IN STAGE 1.
-- It inserts REFERENCE DATA that the Stage 1 tables cannot function without.
-- It is NOT production business data, NOT a backfill, NOT test data.
--
-- Explicitly NOT done anywhere in Stage 1:
--   - builders -> developers backfill
--   - mapping the live Lodha property
--   - creating project_sources for any existing row
--   - modifying any existing properties / builders / leads row
--
-- SIDE EFFECT TO EXPECT: the J1 audit triggers fire on these inserts, so
-- public.audit_log gains 7 rows (47 -> 54), recorded with actor_type
-- 'system' because the SQL Editor carries no JWT role claim. That is correct
-- provenance for an operator-applied migration, and is the reason the J10
-- verification asserts 54 rather than 47.
--
-- ON CONFLICT DO NOTHING (not DO UPDATE) is deliberate: re-running this file
-- must never reset a threshold or rank that an admin has since tuned.

-- ============================================================
-- Locked decision 1: developer > pinnacl > broker > referrer
-- ============================================================
insert into public.source_party_precedence (party_type, precedence_rank, description)
values
  ('developer', 1, 'Promoter / developer. Highest authority on availability of its own inventory.'),
  ('pinnacl',   2, 'Pinnacl Properties itself, where inventory is directly curated and verified.'),
  ('broker',    3, 'External registered broker supplying inventory.'),
  ('referrer',  4, 'Referral partner. Lowest precedence on availability claims.')
on conflict (party_type) do nothing;

-- ============================================================
-- Locked decision 2: 7 / 14 / 30 days
-- ============================================================
insert into public.inventory_freshness_policies (policy_key, max_age_days, description)
values
  ('actively_marketed', 7,  'Actively marketed inventory. Availability must be reconfirmed weekly.'),
  ('standard',          14, 'Normal / under-construction inventory. Default policy for new units.'),
  ('long_cycle',        30, 'Long-cycle inventory where availability changes slowly.')
on conflict (policy_key) do nothing;
