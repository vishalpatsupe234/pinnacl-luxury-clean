// app/page.tsx

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
export const metadata = {
  title: "Luxury Homes in Mumbai",
  description:
    "Discover handpicked luxury residential projects in Mumbai — RERA-verified, thoughtfully curated for lifestyle, legal clarity, and long-term value.",
};


// Original sections
import FeaturedProperties from "@/components/FeaturedProperties";
import WhyPinnaclProperties from "@/components/WhyPinnaclProperties";
import AboutPinnacl from "@/components/AboutPinnacl";
import Collaboration from "@/components/Collaboration";
import Testimonials from "@/components/Testimonials";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import FloatingAction from "@/components/FloatingAction";

// Only Variant C (Hybrid)
import FeaturedC from "@/components/FeaturedC";

export default function Home() {
  return (
    <main
      id="home"
      className="min-h-screen bg-[var(--color-brand-bg)] text-[var(--color-brand-black)]"
    >
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <Hero />

      {/* Only Variant C (Hybrid Card) */}
      <section className="mt-20 mb-20">
        <FeaturedC />
      </section>

      {/* Original Website Sections */}
      <FeaturedProperties />
      <WhyPinnaclProperties />
      <AboutPinnacl />
      <Collaboration />
      <Testimonials />
      <CTA />

      {/* Floating Button */}
      <FloatingAction />

      {/* Footer */}
      <Footer />
    </main>
  );
}
