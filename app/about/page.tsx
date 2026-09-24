import type { Metadata } from "next";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import EnquirySection from "@/components/EnquirySection";
import Footer from "@/components/Footer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pinnaclproperties.com";

export const metadata: Metadata = {
  title: "About Pinnacl Properties",
  description:
    "Learn about Pinnacl Properties — a luxury property advisory built on trust, simplicity, and transparency across Maharashtra.",
  alternates: {
    canonical: `${siteUrl}/about`,
  },
  openGraph: {
    title: "About Pinnacl Properties",
    description:
      "Meet the team behind Pinnacl Properties and discover how we curate premium homes with trust, transparency, and a luxury-first approach.",
    url: `${siteUrl}/about`,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "About Pinnacl Properties",
    description:
      "Meet the team behind Pinnacl Properties and discover how we curate premium homes with trust, transparency, and a luxury-first approach.",
  },
};

const ABOUT_IMAGE =
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-brand-bg text-brand-black">
      <Navbar />

      <section className="pt-32 md:pt-40 pb-16 md:pb-24">
        <div className="section-shell">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className="section-label mb-4">About Us</p>
              <h1 className="section-heading mb-6">
                Luxury Property Advisory, Redefined
              </h1>
              <div className="space-y-4 section-body">
                <p>
                  Pinnacl Properties is a luxury real estate advisory serving
                  discerning buyers across Mumbai, Thane, and Maharashtra. We
                  believe finding a home should feel calm, confident, and
                  entirely personal.
                </p>
                <p>
                  Where we hold a project&apos;s MahaRERA registration number,
                  we publish it on the listing so you can check it yourself on
                  the MahaRERA portal. We don&apos;t list everything — we take
                  on only what fits the kind of advisory work we do.
                </p>
                <p>
                  Our approach is simple: understand what you truly need,
                  present only what fits, and guide you with complete
                  transparency from first conversation to possession.
                </p>
              </div>

              <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
                {[
                  "Curated, Not Listed",
                  "Registration Numbers Published",
                  "Personal, One-to-One Advisory",
                ].map((label) => (
                  <div key={label}>
                    <p className="font-serif text-lg md:text-xl text-brand-gold">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative aspect-[4/5] overflow-hidden">
              <Image
                src={ABOUT_IMAGE}
                alt="Luxury interior"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-24 md:py-32 border-t border-brand-border">
        <div className="section-shell">
          <div className="max-w-3xl mx-auto text-center">
            <p className="section-label mb-4">Our Promise</p>
            <h2 className="section-heading mb-6">
              Built on Four Pillars
            </h2>
            <p className="section-body">
              Luxury in how we present. Trust in what we recommend.
              Simplicity in how we work. Transparency in everything we do.
            </p>
          </div>
        </div>
      </section>

      <EnquirySection />
      <Footer />
    </main>
  );
}
