import type { Metadata } from "next";
import PropertiesClient from "@/components/PropertiesClient";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pinnaclproperties.com";

export const metadata: Metadata = {
  title: "Luxury Properties in Maharashtra",
  description:
    "Browse premium luxury properties in Maharashtra with detailed pricing, location insights, and verified listings curated by Pinnacl Properties.",
  alternates: {
    canonical: `${siteUrl}/properties`,
  },
  openGraph: {
    title: "Luxury Properties in Maharashtra",
    description:
      "Browse premium luxury properties in Maharashtra with detailed pricing, location insights, and verified listings curated by Pinnacl Properties.",
    url: `${siteUrl}/properties`,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Luxury Properties in Maharashtra",
    description:
      "Browse premium luxury properties in Maharashtra with detailed pricing, location insights, and verified listings curated by Pinnacl Properties.",
  },
};

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://pinnaclproperties.com";

  const res = await fetch(`${base}/api/properties`, {
    cache: "no-store",
  });

  const data = await res.json();
  const items = Array.isArray(data) ? data : data?.items ?? [];

  return (
    <section className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Properties</h1>
      <PropertiesClient initialItems={items} />
    </section>
  );
}
