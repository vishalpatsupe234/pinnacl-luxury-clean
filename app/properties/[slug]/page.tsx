import PropertyDetails from "@/components/PropertyDetails";
import { createClient } from "@/lib/supabase/server";
import { resolvePropertyImageUrl } from "@/lib/supabase/propertyImageUrl";
import { publicPropertySurfacesEnabled } from "@/lib/compliance/publicMode";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pinnaclproperties.com";

/* ---------------- SEO META ---------------- */
export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { slug } = await params;

  const projectName = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  // Pre-registration mode: emit no property-specific marketing metadata at
  // all. The page itself 404s below, so any title/description here would
  // only advertise inventory we are not publishing.
  if (!publicPropertySurfacesEnabled()) {
    return {
      title: "Pinnacl Properties",
      robots: { index: false, follow: false },
    };
  }

  // This function derives the title from the URL slug and never reads the
  // database, so it cannot know whether a MahaRERA number is recorded for
  // this property. It therefore must not make any registration or
  // verification claim — the previous copy asserted "RERA-verified" for
  // every property unconditionally. Registration facts belong on the page
  // itself (see ReraDisclosure), where the property row is available.
  return {
    title: `${projectName} | Pinnacl Properties`,
    description: `${projectName} — luxury residential project details, pricing and location from Pinnacl Properties.`,
    alternates: {
      canonical: `${siteUrl}/properties/${slug}`,
    },
    openGraph: {
      title: `${projectName} | Pinnacl Properties`,
      description: `${projectName} offers a premium address, refined amenities, and trusted guidance from Pinnacl Properties.`,
      url: `${siteUrl}/properties/${slug}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${projectName} | Pinnacl Properties`,
      description: `${projectName} offers a premium address, refined amenities, and trusted guidance from Pinnacl Properties.`,
    },
  };
}

/* ---------------- PAGE ---------------- */
export default async function Page({ params }: Props) {
  const { slug } = await params;

  // Pre-registration mode: a direct property slug must not expose property
  // details. notFound() rather than a notice page, so the URL reveals
  // nothing about whether this property exists in our inventory.
  if (!publicPropertySurfacesEnabled()) {
    notFound();
  }

  const supabase = await createClient();
  // Public surface: approved + not soft-deleted is enforced explicitly, not
  // left to RLS (policies are OR'd, so a staff session would otherwise resolve
  // a pending_review or rejected slug here). Anything else falls through to
  // notFound() below, for every visitor including admins.
  //
  // Explicit column list, never "*": only the fields this page's JSON-LD and
  // PropertyDetails (a client component, so its props reach the browser)
  // render. Internal linkage/provenance columns (source_broker_id,
  // project_id, inventory_unit_id, migration_state) must never be selected.
  const { data, error } = await supabase
    .from("properties")
    .select(
      "title, description, images, price, price_display, locality, city, property_type, highlights, is_featured, bedrooms, area_sqft, project_status, rera_number"
    )
    .eq("slug", slug)
    .eq("approval_status", "approved")
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    notFound();
  }

  const images = (data.images ?? []).map(resolvePropertyImageUrl);

  // Property text fields (title/description/locality/city/property_type)
  // are admin-entered free text with no HTML-stripping at insert time.
  // JSON.stringify alone does not escape "<", and a value containing a
  // literal "</script>" would prematurely close this script tag at the
  // HTML-parser level, before any JSON/JS parsing occurs — escaping "<"
  // to its unicode form prevents that byte from ever reaching the HTML
  // tokenizer, while still round-tripping to the original character for
  // any JSON-LD consumer (e.g. Google's structured-data parser).
  const realEstateListingSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: data.title,
    description: data.description || data.title,
    url: `${siteUrl}/properties/${slug}`,
    image: images[0],
    offers: {
      "@type": "Offer",
      price: data.price,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: data.locality,
      addressLocality: data.locality,
      addressRegion: data.city,
      addressCountry: "IN",
    },
    listingType: data.property_type,
  };
  const safeRealEstateListingJson = JSON.stringify(realEstateListingSchema).replace(
    /</g,
    "\\u003c"
  );

  return (
    <main className="min-h-screen bg-[var(--color-brand-bg)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeRealEstateListingJson,
        }}
      />
      <PropertyDetails property={data} images={images} slug={slug} />
    </main>
  );
}
