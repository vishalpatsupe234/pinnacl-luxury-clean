-- Pinnacl Properties — Property Listings Module
--
-- Extends the existing `public.properties` table (from the
-- original Curated Broker Network migration) rather than creating
-- a second/duplicate properties table, following the same
-- reconciliation approach used for `profiles` vs `broker_profiles`.
--
-- `properties` already has: title, slug, builder_id (FK to the
-- existing `builders` table), source_broker_id, rera_number,
-- project_status, approval_status, city, locality, price,
-- price_display, description, highlights, images (jsonb — already
-- exactly what "store image URLs in the table" asks for, no new
-- images table needed), is_featured, deleted_at, timestamps.
--
-- This migration only ADDS what didn't already exist, and adds
-- the RLS/indexing/storage this module specifically needs.

-- ============================================================
-- 1. New columns
-- ============================================================
alter table public.properties
  add column if not exists property_type text,
  add column if not exists bedrooms integer,
  add column if not exists bathrooms integer,
  add column if not exists area_sqft numeric;

comment on column public.properties.property_type is
  'Free-text category (e.g. Apartment, Villa, Plot, Commercial). Not a CHECK-constrained enum by design — real estate categories vary too much to hardcode; filtering still works via the index below.';

-- Field-name mapping vs. the module spec, since `properties`
-- already had overlapping-but-differently-named columns:
--   spec "status"  -> existing project_status (under_construction | ready_to_move | sold_out)
--   spec "featured" -> existing is_featured
--   spec "builder" -> existing builder_id (FK to public.builders), not a plain text
--                      column — see the admin API route for the
--                      get-or-create-by-name convenience layered
--                      on top so the UI can still work with a
--                      plain builder name.
--   spec "images"  -> existing images (jsonb array of Storage URLs)
-- approval_status (pending_review | approved | rejected) is
-- unrelated to either and untouched — it remains the admin
-- moderation gate from the original migration.

-- ============================================================
-- 2. Indexes for city, status, property_type (as requested)
-- ============================================================
create index if not exists properties_city_filter_idx on public.properties (city);
create index if not exists properties_status_filter_idx on public.properties (project_status);
create index if not exists properties_type_filter_idx on public.properties (property_type);

-- ============================================================
-- 3. RLS: approved (active) brokers get read-only access to ALL
-- properties, not just their own and not only approved ones.
-- This is ADDITIVE — RLS policies are permissive/OR'd together,
-- so this only expands broker visibility for this module; it does
-- not remove or alter any existing policy from the original
-- migration (properties_admin_full_access, properties_broker_*,
-- properties_public_read_approved all remain exactly as they were).
--
-- Note: the original migration also granted brokers INSERT/UPDATE
-- on their OWN pending listings (properties_broker_insert_own /
-- properties_broker_update_own_pending), reflecting the earlier
-- "broker uploads their own inventory" vision. This module's own
-- UI (/broker/properties) never calls those operations — it is
-- read-only end-to-end — but the underlying RLS capability was
-- deliberately left in place rather than revoked, since removing
-- it wasn't requested and touching existing policies carries its
-- own risk. Flagged here for a future decision on whether to
-- formally deprecate broker self-upload once this admin-managed
-- catalogue becomes the primary flow.
-- ============================================================
create policy properties_broker_read_all
  on public.properties for select
  to authenticated
  using (public.is_active_broker());

-- ============================================================
-- 4. Storage bucket for property images
-- Public read (listing photos are meant to be publicly visible),
-- writes restricted to super_admin only.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true)
on conflict (id) do nothing;

create policy property_images_public_read
  on storage.objects for select
  to public
  using (bucket_id = 'property-images');

create policy property_images_admin_write
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'property-images' and public.is_super_admin());

create policy property_images_admin_update
  on storage.objects for update
  to authenticated
  using (bucket_id = 'property-images' and public.is_super_admin())
  with check (bucket_id = 'property-images' and public.is_super_admin());

create policy property_images_admin_delete
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'property-images' and public.is_super_admin());
