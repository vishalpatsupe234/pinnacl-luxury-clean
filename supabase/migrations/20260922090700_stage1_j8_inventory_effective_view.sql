-- Pinnacl Properties — STAGE 1 / J8
-- inventory_units_effective: derived availability + staleness
--
-- Availability is never stored. This view derives current state from the
-- append-only unit_availability_claims table, so:
--   * a unit becomes stale purely by the passage of time — no job to run
--   * changing inventory_freshness_policies.max_age_days re-derives every
--     unit immediately, with no migration and no backfill
--   * "AVAILABLE forever" is structurally impossible
--
-- WINNER SELECTION (locked decision 1): lowest precedence_rank wins, then
-- most recent claimed_at. developer(1) > pinnacl(2) > broker(3) > referrer(4).
--
-- The rank used to pick the CURRENT winner is the LIVE rank, read from
-- public.source_party_precedence via claimant_party_type — never the
-- precedence_rank snapshotted onto the claim. The snapshot is historical
-- evidence (what the rank was when the claim was made, validated by J5's
-- insert trigger); it is exposed unchanged as precedence_rank. The live rank
-- is exposed as current_precedence_rank. So a precedence policy change
-- re-derives every current winner immediately, without rewriting history.
--
-- LEFT JOIN, not inner: a claim whose party type had no live rank would
-- otherwise vanish silently. It sorts last (nulls last) instead. In practice
-- J5's trigger refuses a claim with no configured rank, and the
-- source_parties -> source_party_precedence FK blocks removing a rank in use.
--
-- Tie-breaking is fully deterministic: claimed_at desc, then created_at desc,
-- then id desc, so equal rank + equal claimed_at always yields one winner.
--
-- SECURITY (critical): security_invoker = true. Without it a Postgres view
-- runs with the VIEW OWNER's privileges and would bypass RLS on
-- inventory_units and unit_availability_claims entirely — turning an
-- admin-only table into a readable one. With it, RLS applies as the querying
-- user, so this view exposes nothing its caller could not already read.
--
-- 'stale' is a derived state, never a claimed_state: nobody claims staleness.
--
-- RECORDED AS STAGE 2 DECISIONS (deliberately unchanged here):
--   * sold/unavailable freshness semantics — a sold or unavailable winning
--     claim currently becomes effective_state 'stale' once past its policy
--     age (never publishable either way)
--   * merged project visibility — units of a project with merged_into_id set
--     are not excluded; nothing enforces merged => archived
--   * RERA expiry gating — projects.rera_reg_expires_at is not checked by
--     is_publishable
--   * unit-level publish/readiness flag — none exists; a unit qualifies by
--     not being deleted

create or replace view public.inventory_units_effective
with (security_invoker = true)
as
with winning_claim as (
  select distinct on (c.unit_id)
    c.unit_id,
    c.id as claim_id,
    c.claimed_state,
    c.claimed_at,
    c.claimant_party_id,
    c.claimant_party_type,
    c.precedence_rank,
    spp.precedence_rank as current_precedence_rank
  from public.unit_availability_claims c
  left join public.source_party_precedence spp
    on spp.party_type = c.claimant_party_type
  order by
    c.unit_id,
    spp.precedence_rank asc nulls last,
    c.claimed_at desc,
    c.created_at desc,
    c.id desc
)
select
  u.id                      as unit_id,
  u.project_id,
  u.unit_label,
  u.configuration,
  u.freshness_policy_key,
  f.max_age_days,

  w.claim_id                as winning_claim_id,
  w.claimed_state,
  w.claimed_at,
  w.claimant_party_id,
  w.claimant_party_type,
  w.precedence_rank,            -- snapshot at claim time (historical evidence)
  w.current_precedence_rank,    -- live rank that decided the winner

  (w.unit_id is null)       as has_no_claim,

  -- Stale once the winning claim is older than the unit's freshness policy.
  case
    when w.unit_id is null then false
    else (now() - w.claimed_at) > make_interval(days => f.max_age_days)
  end                       as is_stale,

  -- Effective state: unknown if never claimed, stale if past policy, else
  -- whatever the winning claimant asserted.
  case
    when w.unit_id is null then 'unknown'
    when (now() - w.claimed_at) > make_interval(days => f.max_age_days) then 'stale'
    else w.claimed_state
  end                       as effective_state,

  -- Surfaces disagreement rather than silently discarding it: true when some
  -- LOWER-precedence party has made a MORE RECENT claim that contradicts the
  -- winner. Per locked decision 1 the higher-precedence claim still wins, but
  -- the conflict is visible for review.
  exists (
    select 1
    from public.unit_availability_claims c2
    where c2.unit_id = u.id
      and c2.claimed_at > w.claimed_at
      and c2.claimed_state is distinct from w.claimed_state
  )                         as has_conflicting_claim,

  -- Stage 2+ publication predicate, exposed here so there is exactly one
  -- definition of "may be shown". NOT wired to any surface in Stage 1, and
  -- pre-registration public mode remains in force regardless.
  (
    w.unit_id is not null
    and w.claimed_state = 'available'
    and not ((now() - w.claimed_at) > make_interval(days => f.max_age_days))
    and p.lifecycle_state = 'published'
    and p.deleted_at is null
  )                         as is_publishable

from public.inventory_units u
-- Units of a soft-deleted project must not appear as ordinary view rows at
-- all. Filtering in the JOIN (not the WHERE) keeps the exclusion structural:
-- a unit whose project is deleted produces no row, rather than producing a
-- row that some later caller might forget to filter.
join public.projects p
  on p.id = u.project_id
 and p.deleted_at is null
left join winning_claim w
  on w.unit_id = u.id
left join public.inventory_freshness_policies f
  on f.policy_key = u.freshness_policy_key
where u.deleted_at is null;

comment on view public.inventory_units_effective is
  'Derived availability and staleness per unit. Availability is never stored; it is computed from append-only claims using the LIVE source_party_precedence rank (precedence_rank is the claim-time snapshot; current_precedence_rank decided the winner) and freshness policy. security_invoker = true so RLS applies as the querying user.';
