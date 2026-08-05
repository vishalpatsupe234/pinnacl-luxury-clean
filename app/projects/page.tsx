import type { Metadata } from "next";
import propertiesData from "@/data/properties.json";
import Navbar from "@/components/Navbar";
import ProjectsGrid from "@/components/ProjectsGrid";
import EnquirySection from "@/components/EnquirySection";
import Footer from "@/components/Footer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pinnaclproperties.com";

export const metadata: Metadata = {
  title: "Projects | Pinnacl Properties",
  description:
    "Explore our curated portfolio of luxury residential projects across Maharashtra and premium locations.",
  alternates: {
    canonical: `${siteUrl}/projects`,
  },
  openGraph: {
    title: "Pinnacl Properties Projects",
    description:
      "Explore a curated portfolio of luxury residential projects across Maharashtra, selected for architecture, location, and long-term value.",
    url: `${siteUrl}/projects`,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Pinnacl Properties Projects",
    description:
      "Explore a curated portfolio of luxury residential projects across Maharashtra, selected for architecture, location, and long-term value.",
  },
};

export default function ProjectsPage() {
  const items = propertiesData.items;

  return (
    <main className="min-h-screen bg-brand-bg text-brand-black">
      <Navbar />

      <section className="pt-32 md:pt-40 pb-16 md:pb-24">
        <div className="section-shell">
          <div className="max-w-2xl mb-16 md:mb-20">
            <p className="section-label mb-4">Portfolio</p>
            <h1 className="section-heading">Our Projects</h1>
            <p className="section-body mt-4">
              A curated collection of RERA-verified luxury residences — each
              selected for design, location, and long-term value.
            </p>
          </div>

          <ProjectsGrid items={items} />
        </div>
      </section>

      <EnquirySection />
      <Footer />
    </main>
  );
}
