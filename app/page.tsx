import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeaturedC from "@/components/FeaturedC";
import Philosophy from "@/components/Philosophy";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Pinnacl Estate | Ultra-Luxury Residences in Mumbai",
  description:
    "A private advisory placing the most exceptional homes across Mumbai. Discreet, curated, and built for those who value rarity over numbers.",
};

export default function Home() {
  return (
    <main id="residences" className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <FeaturedC />
      <Philosophy />
      <Footer />
    </main>
  );
}
