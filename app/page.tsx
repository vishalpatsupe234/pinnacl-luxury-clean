import type { Metadata } from "next";
import propertiesData from "@/data/properties.json";
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
    "Discover handpicked luxury residential projects across Maharashtra — RERA-verified, thoughtfully curated for lifestyle, legal clarity, and long-term value.",
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

export default function Home() {
  const items = propertiesData.items;

  return (
    <main className="min-h-screen bg-brand-bg text-brand-black">
      <Navbar />
      <Hero />
      <FeaturedProjects items={items} />
      <WhyPinnacl />
      <EnquirySection />
      <Footer />
    </main>
  );
}
