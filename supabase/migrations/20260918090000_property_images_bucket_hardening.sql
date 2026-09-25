-- Pinnacl Properties — Phase 2 Security Hardening
-- Property image upload hardening (Storage bucket-level enforcement)
--
-- lib/supabase/propertyImages.ts already validates MIME type,
-- extension, extension/MIME agreement, size, and file signature
-- client-side before attempting an upload — but a client-side check
-- is only a UX layer, never the real security boundary. This
-- migration adds the actual server-side enforcement: Supabase
-- Storage itself rejects any upload to this bucket that violates
-- these constraints, regardless of what the calling client does or
-- doesn't check.
--
-- Values chosen to match lib/supabase/propertyImages.ts exactly:
-- image/jpeg, image/png, image/webp only; 10MB per file (headroom
-- above this project's own existing photography, which runs up to
-- ~3.5MB per image in public/properties/).
--
-- Scoped to `property-images` only — the only bucket the admin CMS's
-- upload code actually writes to. The `properties` bucket (holding
-- the one live property's images today) is intentionally untouched
-- here; its write policies were verified live (anon INSERT/UPDATE/
-- DELETE all confirmed denied) but were not created by any migration
-- in this repository, so this migration does not assume anything
-- about it or alter it.

update storage.buckets
set
  file_size_limit = 10485760, -- 10MB, in bytes
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'property-images';
