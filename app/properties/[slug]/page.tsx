import PropertyDetails from "@/components/PropertyDetails";
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

  return {
    title: `${projectName} | Pinnacl Properties`,
    description: `${projectName} — a RERA-verified luxury residential project with transparent advisory and long-term value.`,
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

  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const res = await fetch(`${base}/api/properties?slug=${slug}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch property");
  }

  const data = await res.json();

  return (
    <main className="min-h-screen bg-[var(--color-brand-bg)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "RealEstateListing",
            name: data.title,
            description: data.title,
            url: `${siteUrl}/properties/${slug}`,
            image: data.images?.[0],
            offers: {
              "@type": "Offer",
              price: data.price,
              priceCurrency: "INR",
              availability: "https://schema.org/InStock",
            },
            address: {
              "@type": "PostalAddress",
              streetAddress: data.location?.address,
              addressLocality: data.location?.area,
              addressRegion: data.location?.city,
              addressCountry: "IN",
            },
            listingType: data.type,
          }),
        }}
      />
      <PropertyDetails property={data} />
    </main>
  );
}
