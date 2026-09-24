// Resolves a value from `properties.images` into a URL an <img>/<Image>
// tag can load directly. Two real formats exist in production data,
// verified directly against Storage (not assumed):
//
// 1. Admin-CMS-uploaded images (lib/supabase/propertyImages.ts) are always
//    already-absolute public Storage URLs from the "property-images"
//    bucket (via getPublicUrl()) — these must pass through unchanged.
// 2. A small number of legacy/seeded records (e.g. the live
//    "lodha-world-towers-lower-parel" property) store bare relative
//    paths such as "lodha-world-towers/lodha-world-1.jpg". Those exact
//    files live in a separate "properties" bucket that was created and
//    populated by hand outside the admin CMS's upload flow — confirmed
//    live via the Storage API. Do not repoint this at "property-images":
//    that bucket does not contain these files, and doing so would break
//    the one real property currently in production.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const LEGACY_RELATIVE_PATH_BUCKET = "properties";

export function resolvePropertyImageUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${LEGACY_RELATIVE_PATH_BUCKET}/${value}`;
}
