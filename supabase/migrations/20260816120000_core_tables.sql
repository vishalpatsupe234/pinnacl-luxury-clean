-- Pinnacl Properties — Curated Broker Network
-- Migration 1 of 3: Core entity tables (profiles, builders, properties, leads)
--
-- Implements the data model described in CLAUDE.md §6 (Business
-- Architecture — Community Brokerage System) and "Curated Broker
-- Network (Long-Term Business Architecture)". Those sections are
-- documented in CLAUDE.md as Planned/not-yet-built; this migration
-- is the first real implementation step, not yet wired to any UI.

create extension if not exists "pgcrypto";

-- ============================================================
-- Generic updated_at trigger function, reused by every table
-- that carries an updated_at column.
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- 1. profiles
-- Extends auth.users with Pinnacl-specific role/status data.
-- Every row must correspond to a real auth.users row created by
-- Super Admin via the Supabase Auth Admin API (invite-only — see
-- CLAUDE.md "Invite-Only Broker System"). No client INSERT policy
-- is granted anywhere in this migration set — self-registration
-- is not possible through the database layer.
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'viewer'
    check (role in ('super_admin', 'verified_broker', 'sales_partner', 'viewer')),
  full_name text,
  phone text,
  kyc_status text not null default 'pending'
    check (kyc_status in ('pending', 'verified', 'rejected')),
  status text not null default 'pending_approval'
    check (status in ('pending_approval', 'active', 'suspended')),
  invited_by uuid references public.profiles(id),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Broker/admin/viewer accounts. Invite-only: created manually by Super Admin, never by self-registration.';
comment on column public.profiles.deleted_at is
  'Soft delete only. No hard delete — see CLAUDE.md Anti-Cheat Rules: "Deleted records are archived, not destroyed."';

create index profiles_role_idx on public.profiles (role);
create index profiles_status_idx on public.profiles (status);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Enforce: only a super_admin may change a profile's role.
-- Implemented as a trigger (not an RLS WITH CHECK subquery) to
-- avoid the self-referential-query ambiguity RLS policies would
-- introduce on this specific table.
create or replace function public.enforce_profile_role_change_admin_only()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if not exists (
      select 1 from public.profiles where id = auth.uid() and role = 'super_admin'
    ) then
      raise exception 'Only super_admin may change a profile role';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_role_change_admin_only
  before update on public.profiles
  for each row execute function public.enforce_profile_role_change_admin_only();

-- ============================================================
-- 2. builders
-- Builder / Developer partner entities.
-- ============================================================
create table public.builders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_email text,
  contact_phone text,
  rera_registration_number text,
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'rejected')),
  created_by uuid references public.profiles(id),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index builders_verification_status_idx on public.builders (verification_status);
create index builders_name_idx on public.builders (name);

create trigger builders_set_updated_at
  before update on public.builders
  for each row execute function public.set_updated_at();

-- ============================================================
-- 3. properties
-- Every property permanently records its Source Broker — see
-- CLAUDE.md "Property Ownership Logic": this never changes, even
-- if another broker later closes a sale on it. Enforced below by
-- trigger, not merely by convention.
-- ============================================================
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  builder_id uuid references public.builders(id),
  source_broker_id uuid not null references public.profiles(id),
  rera_number text,
  project_status text not null default 'under_construction'
    check (project_status in ('under_construction', 'ready_to_move', 'sold_out')),
  approval_status text not null default 'pending_review'
    check (approval_status in ('pending_review', 'approved', 'rejected')),
  city text,
  locality text,
  price numeric,
  price_display text,
  bhk integer,
  area_text text,
  description text,
  highlights jsonb not null default '[]'::jsonb,
  images jsonb not null default '[]'::jsonb,
  is_featured boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.properties.source_broker_id is
  'The uploading broker. Permanent — see enforce_source_broker_immutable() trigger below. Never silently transferred.';

create index properties_builder_id_idx on public.properties (builder_id);
create index properties_source_broker_id_idx on public.properties (source_broker_id);
create index properties_approval_status_idx on public.properties (approval_status);
create index properties_city_locality_idx on public.properties (city, locality);
create index properties_project_status_idx on public.properties (project_status);

create trigger properties_set_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

-- Enforce: source_broker_id can never be changed after insert.
create or replace function public.enforce_source_broker_immutable()
returns trigger
language plpgsql
as $$
begin
  if new.source_broker_id is distinct from old.source_broker_id then
    raise exception 'source_broker_id is permanent and cannot be changed (property %)', old.id;
  end if;
  return new;
end;
$$;

create trigger properties_source_broker_immutable
  before update on public.properties
  for each row execute function public.enforce_source_broker_immutable();

-- ============================================================
-- 4. leads
-- Every enquiry. Assigned broker drives lead ownership/routing —
-- see CLAUDE.md "Lead Ownership".
-- ============================================================
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id),
  buyer_name text not null,
  buyer_phone text,
  buyer_email text,
  message text,
  assigned_broker_id uuid references public.profiles(id),
  status text not null default 'new'
    check (status in ('new', 'contacted', 'site_visit_scheduled', 'negotiating', 'closed_won', 'closed_lost')),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_property_id_idx on public.leads (property_id);
create index leads_assigned_broker_id_idx on public.leads (assigned_broker_id);
create index leads_status_idx on public.leads (status);
create index leads_created_at_idx on public.leads (created_at);

create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();
