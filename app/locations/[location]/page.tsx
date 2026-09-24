// app/locations/[location]/page.tsx

import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { publicPropertySurfacesEnabled } from "@/lib/compliance/publicMode";

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

  // Pre-registration mode: generate no property-marketing metadata. This
  // route accepts any slug, so it would otherwise mint a
  // "Luxury Properties in <anything>" title for arbitrary URLs while we are
  // not publishing inventory. The page 404s below.
  if (!publicPropertySurfacesEnabled()) {
    return {
      title: "Pinnacl Properties",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `Luxury Properties in ${formatted} | Pinnacl Properties`,
    description: `Explore luxury residential projects in ${formatted} with Pinnacl Properties. Registration details are published on each listing where we hold them.`,
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

  // Pre-registration mode: this route exists only to funnel visitors into
  // filtered inventory. With inventory unpublished there is nothing to funnel
  // to, so it resolves as not-found rather than bouncing to a holding notice.
  if (!publicPropertySurfacesEnabled()) {
    notFound();
  }

  // SEO-safe redirect to filtered properties page
  redirect(`/properties?loc=${encodeURIComponent(location)}`);
}
