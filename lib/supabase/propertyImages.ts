"use client";

import { createClient } from "./client";

// Uploads directly from the browser to the `property-images`
// Storage bucket using the caller's own authenticated session —
// no service role, no Route Handler in the middle. Storage RLS
// (see the property listings migration) restricts writes to
// super_admin, so this is safe to call from the admin UI only.
export async function uploadPropertyImages(files: File[]): Promise<string[]> {
  const supabase = createClient();
  const urls: string[] = [];

  for (const file of files) {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from("property-images")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (error) {
      throw new Error(`Failed to upload ${file.name}: ${error.message}`);
    }

    const { data } = supabase.storage.from("property-images").getPublicUrl(path);
    urls.push(data.publicUrl);
  }

  return urls;
}
