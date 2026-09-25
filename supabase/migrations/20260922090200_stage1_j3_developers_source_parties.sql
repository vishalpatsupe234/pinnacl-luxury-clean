-- Pinnacl Properties — STAGE 1 / J3
-- developers (promoter identity) + source_parties (who may be a source)
--
-- `developers` supersedes `builders` CONCEPTUALLY ONLY. builders is NOT
-- dropped, renamed or modified: properties.builder_id still references it and
-- four other tables still depend on properties. developers.legacy_builder_id
-- carries the link forward without touching either existing table.
--
-- NO BACKFILL HERE. builders -> developers is Stage 1b, after approval.
--
-- `source_parties` is where the D1/D2 registration decisions live: every
-- participant carries its OWN registration evidence. Nothing is inherited
-- from the founder's individual registration. Registration validity is
-- DATED (verified_at / expires_at), never a boolean, so a lapsed or
-- deregistered counterparty is detectable rather than silently stale.
--
-- Pinnacl itself is a source_parties row with party_type='pinnacl' and no
-- profile_id — modelling Pinnacl as a `profile` would repeat the exact
-- category error that source_broker_id made.

-- ============================================================
-- 1. developers
-- ============================================================
create table if not exists public.developers (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  -- Deterministic normalisation for duplicate detection (J6). All three
  -- functions are IMMUTABLE, which a generated column requires.
  normalised_name      text generated always as (
                         btrim(regexp_replace(lower(name), '[^a-z0-9]+', ' ', 'g'))
                       ) stored,
  rera_promoter_reg_no text,
  rera_reg_verified_at timestamptz,
  rera_reg_verified_by uuid references public.profiles(id),
  website              text,
  verification_status  text not null default 'unverified',
  legacy_builder_id    uuid references public.builders(id),
  note                 text,
  created_by           uuid references public.profiles(id),
  deleted_at           timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint developers_verification_status_check
    check (verification_status in ('unverified', 'verified', 'rejected')),
  -- HUMAN VERIFICATION INVARIANT (hardened).
  -- A developer cannot be marked verified without BOTH a verification
  -- timestamp AND the identity of the human who performed it. Requiring
  -- verified_by as well as verified_at means "verified" can never be a
  -- self-asserting flag — there is always an attributable person behind it.
  -- Same principle as the projects publication invariant (J4).
  -- No RERA format validation — REQUIRES MAHARERA CONFIRMATION.
  constraint developers_verified_requires_evidence_check
    check (
      verification_status <> 'verified'
      or (rera_reg_verified_at is not null and rera_reg_verified_by is not null)
    )
);

comment on table public.developers is
  'Promoter / developer identity. Supersedes builders conceptually; builders remains in place and untouched. No RERA format validation is applied — REQUIRES MAHARERA CONFIRMATION.';
comment on column public.developers.legacy_builder_id is
  'Link to the pre-Stage-1 builders row, so the old and new models can coexist without migrating data.';

create unique index if not exists developers_normalised_name_key
  on public.developers (normalised_name) where deleted_at is null;
create unique index if not exists developers_rera_promoter_reg_no_key
  on public.developers (rera_promoter_reg_no)
  where rera_promoter_reg_no is not null and deleted_at is null;
create index if not exists developers_legacy_builder_id_idx
  on public.developers (legacy_builder_id);

-- ============================================================
-- 2. source_parties
-- ============================================================
create table if not exists public.source_parties (
  id                        uuid primary key default gen_random_uuid(),
  party_type                text not null
                              references public.source_party_precedence(party_type),
  profile_id                uuid references public.profiles(id),
  developer_id              uuid references public.developers(id),
  display_name              text not null,
  -- Per-participant registration evidence (D1/D2). Never inherited.
  rera_agent_reg_no         text,
  rera_reg_verified_at      timestamptz,
  rera_reg_expires_at       timestamptz,
  registration_evidence_ref text,
  status                    text not null default 'active',
  note                      text,
  created_by                uuid references public.profiles(id),
  deleted_at                timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  constraint source_parties_status_check
    check (status in ('active', 'suspended', 'retired')),
  -- The identity target must match the party type: a developer party points
  -- at a developer, a broker/referrer party points at a profile, and Pinnacl
  -- points at neither.
  constraint source_parties_identity_check check (
    (party_type = 'developer'               and developer_id is not null and profile_id is null)
    or (party_type in ('broker','referrer') and profile_id   is not null and developer_id is null)
    or (party_type = 'pinnacl'              and profile_id   is null     and developer_id is null)
  )
);

comment on table public.source_parties is
  'Any party that may be recorded as a source of a project or an availability claim. Carries its own RERA registration evidence — nothing is inherited from the founder registration. Being a source party confers NO commercial entitlement.';
comment on column public.source_parties.display_name is
  'May be a natural persons name for an individual broker or referrer, therefore personal data. Covered by redact_audit_pii from J7 onward.';
comment on column public.source_parties.rera_reg_expires_at is
  'Dated, never boolean: a lapsed or deregistered counterparty must be detectable. REQUIRES MAHARERA CONFIRMATION on whether lapse/deregistration can be checked programmatically.';

create unique index if not exists source_parties_profile_id_key
  on public.source_parties (profile_id) where profile_id is not null and deleted_at is null;
create index if not exists source_parties_party_type_idx  on public.source_parties (party_type);
create index if not exists source_parties_developer_id_idx on public.source_parties (developer_id);

-- ============================================================
-- RLS — enabled before any grant. Admin-only in Stage 1.
-- Broker policies are specified in the design but deliberately NOT created:
-- no broker surface exists to consume them, so creating them now would be
-- unused, untestable grant surface. Locked decision 8: no anon policy.
-- ============================================================
alter table public.developers     enable row level security;
alter table public.source_parties enable row level security;

drop policy if exists developers_admin_all on public.developers;
create policy developers_admin_all
  on public.developers for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists source_parties_admin_all on public.source_parties;
create policy source_parties_admin_all
  on public.source_parties for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- ============================================================
-- Triggers: existing set_updated_at + existing log_audit_event
-- ============================================================
drop trigger if exists developers_set_updated_at on public.developers;
create trigger developers_set_updated_at
  before update on public.developers
  for each row execute function public.set_updated_at();

drop trigger if exists developers_audit on public.developers;
create trigger developers_audit
  after insert or update or delete on public.developers
  for each row execute function public.log_audit_event();

drop trigger if exists source_parties_set_updated_at on public.source_parties;
create trigger source_parties_set_updated_at
  before update on public.source_parties
  for each row execute function public.set_updated_at();

drop trigger if exists source_parties_audit on public.source_parties;
create trigger source_parties_audit
  after insert or update or delete on public.source_parties
  for each row execute function public.log_audit_event();
