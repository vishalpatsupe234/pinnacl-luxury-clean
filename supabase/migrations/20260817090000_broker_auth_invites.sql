-- Pinnacl Properties — Production Invite-Only Broker Authentication
-- Extends the existing `profiles` table (from the prior Curated
-- Broker Network migration) rather than creating a duplicate
-- `broker_profiles` table — decided directly with the owner to
-- avoid two overlapping account tables.
--
-- Scope: authentication + invite + approval only. Does NOT touch
-- properties, deals, or commission_ledger.

-- ============================================================
-- 1. profiles: add a distinct 'rejected' status.
-- Previously: pending_approval | active | suspended. A rejected
-- broker is a different state from a later-suspended active
-- broker, so it needs its own value rather than overloading
-- 'suspended'.
-- ============================================================
alter table public.profiles
  drop constraint if exists profiles_status_check;

alter table public.profiles
  add constraint profiles_status_check
  check (status in ('pending_approval', 'active', 'rejected', 'suspended'));

-- ============================================================
-- 2. invites
-- Every broker account is created through one of these rows —
-- there is no other path to a broker/sales_partner profile.
-- Only a super_admin may create one (see RLS below).
-- ============================================================
create table public.invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text not null default 'verified_broker'
    check (role in ('verified_broker', 'sales_partner')),
  token text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'expired', 'revoked')),
  invited_by uuid not null references public.profiles(id),
  created_profile_id uuid references public.profiles(id),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.invites is
  'The only path to creating a broker/sales_partner account. No public signup exists anywhere in this schema.';
comment on column public.invites.token is
  'Opaque random token embedded in the invite link (/broker/accept-invite?token=...). Never guessable, never reused across invites.';

create index invites_email_idx on public.invites (email);
create index invites_token_idx on public.invites (token);
create index invites_status_idx on public.invites (status);
create index invites_invited_by_idx on public.invites (invited_by);

-- Reuse the audit trigger already defined for the other 6 tables
-- (see the prior Curated Broker Network migration) — every
-- invite created/accepted/revoked is logged the same way.
create trigger invites_audit
  after insert or update or delete on public.invites
  for each row execute function public.log_audit_event();

-- ============================================================
-- RLS
-- ============================================================
alter table public.invites enable row level security;

create policy invites_admin_full_access
  on public.invites for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- Deliberately no policy for `anon` or for a non-admin
-- `authenticated` role: an unauthenticated visitor who has just
-- clicked an invite link is not yet logged in and cannot pass
-- `authenticated`/`is_super_admin()` at all. Token validation and
-- account creation for that visitor are handled exclusively by
-- the /api/broker/accept-invite Route Handler using the service
-- role key server-side, which bypasses RLS by design — this table
-- is intentionally unreachable from any client-side query.
