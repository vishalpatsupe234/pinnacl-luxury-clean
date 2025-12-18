// app/locations/[location]/page.tsx

import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

/* ---------------------------
   HELPERS
---------------------------- */
function formatLocation(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/* ---------------------------
   SEO METADATA (Next.js 15 SAFE)
   ✅ params = Promise
---------------------------- */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ location: string }>;
}): Promise<Metadata> {
  const { location } = await params;
  const formatted = formatLocation(location);

  return {
    title: `Luxury Properties in ${formatted} | Pinnacl Properties`,
    description: `Explore RERA-verified luxury residential projects in ${formatted}. Handpicked homes offering lifestyle value, legal clarity, and long-term confidence.`,
  };
}

/* ---------------------------
   PAGE (Next.js 15 SAFE)
   ✅ params = Promise
---------------------------- */
export default async function LocationPage({
  params,
}: {
  params: Promise<{ location: string }>;
}) {
  const { location } = await params;

  if (!location) {
    notFound();
  }

  // SEO-safe redirect to filtered properties page
  redirect(`/properties?loc=${encodeURIComponent(location)}`);
}
