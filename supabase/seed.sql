-- Pinnacl Properties — seed data
-- Run automatically by `supabase db reset` (applies all
-- migrations in supabase/migrations/, then this file) against a
-- LOCAL Supabase dev instance. Do not run this file's auth.users
-- insert against a live production project — see note below.

-- ------------------------------------------------------------
-- Local/dev only: creates a matching auth.users row so the
-- profiles insert below satisfies its foreign key constraint.
-- This is a `supabase db reset` / local-dev convenience only.
-- In production, admin and broker accounts must be created via
-- the real Supabase Auth Admin API (supabase.auth.admin.createUser)
-- as part of the invite workflow documented in CLAUDE.md
-- ("Invite-Only Broker System") — never by a raw SQL insert into
-- auth.users.
-- ------------------------------------------------------------
insert into auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values (
  '00000000-0000-0000-0000-000000000001',
  'founder@pinnaclproperties.example',
  crypt('replace-this-password-before-any-real-use', gen_salt('bf')),
  now(),
  now(),
  now()
)
on conflict (id) do nothing;

-- ---- Super Admin profile ----
insert into public.profiles (id, role, full_name, kyc_status, status)
values (
  '00000000-0000-0000-0000-000000000001',
  'super_admin',
  'Pinnacl Founder',
  'verified',
  'active'
)
on conflict (id) do nothing;

-- ---- Sample builder ----
insert into public.builders (id, name, contact_email, rera_registration_number, verification_status, created_by)
values (
  '10000000-0000-0000-0000-000000000001',
  'Pinnacl Developers Pvt Ltd',
  'projects@pinnacldevelopers.example',
  'P51800000001',
  'verified',
  '00000000-0000-0000-0000-000000000001'
)
on conflict (id) do nothing;

-- ---- Sample properties ----
-- Migrated from the existing placeholder data/properties.json
-- (Pinnacl Crest, Aurelia, Bayview) — the same 3 listings the
-- current static-JSON site shows today, now expressed as real
-- rows with the required ownership/RERA/status fields. The
-- currency-mojibake bug documented in CLAUDE.md §9 (Technical
-- Debt) is corrected here rather than carried forward.
insert into public.properties (
  id, title, slug, builder_id, source_broker_id, rera_number,
  project_status, approval_status, city, locality, price,
  price_display, bhk, area_text, highlights, images, is_featured
)
values
  (
    '20000000-0000-0000-0000-000000000001',
    'Pinnacl Crest, Powai',
    'pinnacl-crest-powai',
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    null,
    'ready_to_move',
    'approved',
    'Mumbai',
    'Powai',
    32000000,
    '₹3.2 Cr onwards',
    2,
    '780 - 1150 sq.ft',
    '["OC received - no GST applicable", "Walkable to business & lake"]'::jsonb,
    '["/properties/crest.webp"]'::jsonb,
    true
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    'Pinnacl Aurelia',
    'pinnacl-aurelia-bkc',
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    null,
    'under_construction',
    'approved',
    'Mumbai',
    'BKC Annexe',
    48000000,
    '₹4.8 Cr onwards',
    3,
    '1050 - 1350 sq.ft',
    '["Close to BKC corporate hub", "Club, gym & amenities"]'::jsonb,
    '["/properties/aurelia.webp"]'::jsonb,
    false
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    'Pinnacl Bayview',
    'pinnacl-bayview-worli',
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    null,
    'under_construction',
    'approved',
    'Mumbai',
    'Worli',
    65000000,
    '₹6.5 Cr onwards',
    3,
    '1350 - 1850 sq.ft',
    '["Sea Facing", "Premium address"]'::jsonb,
    '["/properties/bayview.webp"]'::jsonb,
    false
  )
on conflict (id) do nothing;
