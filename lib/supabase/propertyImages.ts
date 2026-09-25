"use client";

import { createClient } from "./client";

// Uploads directly from the browser to the `property-images`
// Storage bucket using the caller's own authenticated session —
// no service role, no Route Handler in the middle. Storage RLS
// (see the property listings migration) restricts writes to
// super_admin, so this is safe to call from the admin UI only.
//
// The checks below are a fast-fail UX layer, not the real security
// boundary — a client can always be bypassed. The actual
// server-side enforcement is the `property-images` bucket's own
// `file_size_limit`/`allowed_mime_types` configuration (set via the
// Storage Management API — see supabase/migrations/
// 20260918090000_property_images_bucket_hardening.sql), which
// Supabase's backend enforces on every upload regardless of what
// this code does or doesn't check.

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;

// 10MB per image. Chosen from this project's own real photography:
// the existing local placeholder images in public/properties/ run
// up to ~3.5MB (full-resolution professional shots), so 10MB leaves
// real headroom for legitimate luxury property photography without
// being an arbitrary/unbounded limit.
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const MIME_TO_EXTENSIONS: Record<(typeof ALLOWED_MIME_TYPES)[number], string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
};

// Lightweight file-signature ("magic bytes") check — no dependency
// needed, just a byte-level read of the file's own header. Confirms
// the file's actual content matches its declared MIME type, rather
// than trusting the browser-reported type or the filename alone.
async function matchesDeclaredSignature(file: File): Promise<boolean> {
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());

  switch (file.type) {
    case "image/jpeg":
      return header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
    case "image/png":
      return (
        header[0] === 0x89 &&
        header[1] === 0x50 &&
        header[2] === 0x4e &&
        header[3] === 0x47
      );
    case "image/webp":
      return (
        header[0] === 0x52 && // R
        header[1] === 0x49 && // I
        header[2] === 0x46 && // F
        header[3] === 0x46 && // F
        header[8] === 0x57 && // W
        header[9] === 0x45 && // E
        header[10] === 0x42 && // B
        header[11] === 0x50 // P
      );
    default:
      return false;
  }
}

function validateFile(file: File): string | null {
  if (file.size === 0) {
    return `${file.name}: file is empty`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `${file.name}: exceeds the ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB limit`;
  }

  const mimeType = file.type as (typeof ALLOWED_MIME_TYPES)[number];
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return `${file.name}: unsupported file type (${file.type || "unknown"})`;
  }

  // Never trust the original filename for security decisions — it's
  // fully attacker-controlled — but do use it to catch an honest
  // MIME/extension mismatch (e.g. a .png renamed to .jpg) before
  // upload, since Supabase Storage's own MIME check trusts the
  // browser-reported Content-Type, not the extension.
  const originalExt = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.includes(originalExt as (typeof ALLOWED_EXTENSIONS)[number])) {
    return `${file.name}: unsupported file extension`;
  }
  if (!MIME_TO_EXTENSIONS[mimeType].includes(originalExt)) {
    return `${file.name}: file extension does not match its content type`;
  }

  return null;
}

export async function uploadPropertyImages(files: File[]): Promise<string[]> {
  for (const file of files) {
    const error = validateFile(file);
    if (error) {
      throw new Error(error);
    }
    if (!(await matchesDeclaredSignature(file))) {
      throw new Error(`${file.name}: file content does not match its declared type`);
    }
  }

  const supabase = createClient();
  const urls: string[] = [];

  for (const file of files) {
    // The stored filename is always a fresh random UUID plus the
    // already-validated extension — the original filename is never
    // used to construct the storage path, which rules out path
    // traversal or any other filename-driven attack.
    const ext = file.name.split(".").pop()!.toLowerCase();
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from("property-images")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      throw new Error(`Failed to upload ${file.name}: ${error.message}`);
    }

    const { data } = supabase.storage.from("property-images").getPublicUrl(path);
    urls.push(data.publicUrl);
  }

  return urls;
}
