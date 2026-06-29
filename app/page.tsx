import propertiesData from "@/data/properties.json";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeaturedProjects from "@/components/FeaturedProjects";
import WhyPinnacl from "@/components/WhyPinnacl";
import EnquirySection from "@/components/EnquirySection";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Luxury Homes in Mumbai",
  description:
    "Discover handpicked luxury residential projects in Mumbai — RERA-verified, thoughtfully curated for lifestyle, legal clarity, and long-term value.",
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
