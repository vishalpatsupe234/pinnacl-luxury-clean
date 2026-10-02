import type { Metadata } from "next";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import EnquirySection from "@/components/EnquirySection";
import Footer from "@/components/Footer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pinnaclproperties.com";

export const metadata: Metadata = {
  title: "About Pinnacl Properties",
  description:
    "How Pinnacl Properties works, who runs it, and what we check before presenting a property.",
  alternates: {
    canonical: `${siteUrl}/about`,
  },
  openGraph: {
    title: "About Pinnacl Properties",
    description:
      "How Pinnacl Properties works, who runs it, and what we check before presenting a property.",
    url: `${siteUrl}/about`,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "About Pinnacl Properties",
    description:
      "How Pinnacl Properties works, who runs it, and what we check before presenting a property.",
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
                How we work
              </h1>
              <div className="space-y-4 section-body">
                <p>
                  Pinnacl Properties helps buyers find and evaluate
                  residential property in Maharashtra. We are an early-stage
                  business, and we would rather say that plainly than imply a
                  scale we have not reached.
                </p>
                <p>
                  Where we hold a project&apos;s MahaRERA registration number,
                  we publish it on the listing so you can check it yourself on
                  the MahaRERA portal. We do not list everything — we take on
                  a property only when we can stand behind the information we
                  publish about it.
                </p>
                <p>
                  Before we present a property we check its approvals, the
                  basis of its pricing, and the developer&apos;s record. If
                  something does not hold up, we say so rather than present it.
                </p>
                <p>
                  Pinnacl Properties is run by Vishal Patsupe, who holds a
                  MahaRERA Certificate of Competency. The agent registration
                  number is still pending; until it is issued we are not
                  publishing property listings on this website.
                </p>
              </div>

              <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
                {[
                  "Selected, Not Listed",
                  "Registration Numbers Published",
                  "One Person, Start to Finish",
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
                alt="Residential interior"
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
            <p className="section-label mb-4">Our Approach</p>
            <h2 className="section-heading mb-6">
              How we work in practice
            </h2>
            <p className="section-body">
              What we check before presenting a property, and how we work
              once you get in touch.
            </p>
          </div>
        </div>
      </section>

      <EnquirySection />
      <Footer />
    </main>
  );
}
