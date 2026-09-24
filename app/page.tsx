import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { publicPropertySurfacesEnabled } from "@/lib/compliance/publicMode";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeaturedProjects from "@/components/FeaturedProjects";
import WhyPinnacl from "@/components/WhyPinnacl";
import EnquirySection from "@/components/EnquirySection";
import Footer from "@/components/Footer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pinnaclproperties.com";

export const metadata: Metadata = {
  title: "Luxury Homes in Maharashtra",
  description:
    "Luxury residential projects across Maharashtra. Each listing publishes the project's MahaRERA registration number where we hold it.",
  alternates: {
    canonical: `${siteUrl}/`,
  },
  openGraph: {
    title: "Pinnacl Properties | Luxury Homes in Maharashtra",
    description:
      "Discover premium luxury residences across Maharashtra with curated advisory, transparent guidance, and trusted project selection.",
    url: `${siteUrl}/`,
    type: "website",
    images: [
      {
        url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
        width: 1200,
        height: 630,
        alt: "Luxury homes in Maharashtra",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pinnacl Properties | Luxury Homes in Maharashtra",
    description:
      "Discover premium luxury residences across Maharashtra with curated advisory, transparent guidance, and trusted project selection.",
    images: [
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    ],
  },
};

export default async function Home() {
  // Public surface: the visibility rule is enforced explicitly below, not
  // delegated to RLS. RLS policies are OR'd, so properties_broker_read_all
  // (any active broker) and properties_admin_full_access would otherwise
  // also match pending_review, rejected and soft-deleted rows for a
  // logged-in staff session — showing non-public inventory on a public page.
  // Pre-registration mode: no featured inventory is fetched or rendered.
  // Brand content on this page is unaffected.
  //
  // Explicit column list, never "*": only the fields FeaturedProjects renders
  // reach the public page payload. Internal linkage/provenance columns
  // (source_broker_id, project_id, inventory_unit_id, migration_state) must
  // never be selected here. Keep in sync with the PropertyRow type in
  // components/FeaturedProjects.tsx.
  const showInventory = publicPropertySurfacesEnabled();

  const { data: featuredProperties } = showInventory
    ? await (await createClient())
        .from("properties")
        .select("id, slug, title, description, images, price, price_display, locality, city, area_text, area_sqft")
        .eq("is_featured", true)
        .eq("approval_status", "approved")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
    : { data: null };

  return (
    <main className="min-h-screen bg-brand-bg text-brand-black">
      <Navbar />
      <Hero />
      {showInventory && <FeaturedProjects properties={featuredProperties ?? []} />}
      <WhyPinnacl />
      <EnquirySection />
      <Footer />
    </main>
  );
}
