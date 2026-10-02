import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pinnaclproperties.com";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "Terms of use for the Pinnacl Properties website, including how property information should be treated and what an enquiry does and does not create.",
  alternates: { canonical: `${siteUrl}/terms` },
  openGraph: {
    title: "Terms of Use | Pinnacl Properties",
    description: "Terms of use for the Pinnacl Properties website.",
    url: `${siteUrl}/terms`,
  },
};

// Plain-language website terms.
//
// Deliberately NOT written as a lawyer-reviewed legal document, and it does not
// claim to be one — the closing paragraph says so. It states only what is
// factually true today: information may come from third parties, property
// details change, and an enquiry is a conversation rather than a reservation.
//
// No regulatory status is asserted. The MahaRERA agent registration number is
// not referenced, because it has not been issued; ReraDisclosure is the single
// component responsible for that line and it renders nothing until the number
// is configured.

const SECTIONS: { heading: string; body: string[] }[] = [
  {
    heading: "About this website",
    body: [
      "This website is published by Pinnacl Properties. The information on it is provided for general information only. It is not advice on any specific property, investment or legal matter.",
    ],
  },
  {
    heading: "Property information",
    body: [
      "Where property information appears on this website, some of it originates from developers, property owners or other third parties. We publish what we have been given and what we are able to check.",
      "Availability, pricing, carpet and built-up areas, specifications, layouts, approvals, amenities and completion dates can change, and may change without this website being updated immediately.",
      "Nothing on this website is an offer, and we do not guarantee that a property is available or that a price shown is current.",
    ],
  },
  {
    heading: "Please verify before you decide",
    body: [
      "Before you make any commitment, please verify the details that matter to you directly — with the developer or owner, on the MahaRERA portal where a project registration number is published, and with your own legal and financial advisers.",
      "Where we hold a project's MahaRERA registration number, we publish it so that you can check it yourself.",
    ],
  },
  {
    heading: "Enquiries",
    body: [
      "Submitting an enquiry form, sending a message or speaking with us does not create a booking, reservation, allotment or any other entitlement to a property, and it does not oblige you to proceed.",
      "A booking or transaction only exists once it is recorded in writing by the developer or owner concerned, on their terms.",
    ],
  },
  {
    heading: "Limits of what we can be responsible for",
    body: [
      "We take care over what we publish, but we cannot accept responsibility for decisions taken solely on the basis of information on this website, or for information supplied to us by a third party that later turns out to be inaccurate or out of date.",
      "This website may be unavailable from time to time, and its content may be changed or removed at any time.",
    ],
  },
  {
    heading: "Contact",
    body: [
      "If anything on this website is unclear, or you believe something here is inaccurate, please tell us and we will look into it.",
    ],
  },
];

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-bg text-brand-black">
        <section className="section-shell py-24 md:py-32">
          <div className="max-w-2xl">
            <p className="section-label mb-4">Legal</p>
            <h1 className="section-heading mb-6">Terms of Use</h1>
            <p className="section-body mb-16">
              Plain terms covering how to treat the information on this website
              and what an enquiry does and does not create.
            </p>

            <div className="space-y-12">
              {SECTIONS.map((section) => (
                <div key={section.heading}>
                  <h2 className="font-serif text-xl text-brand-black mb-4">
                    {section.heading}
                  </h2>
                  <div className="space-y-3">
                    {section.body.map((paragraph) => (
                      <p
                        key={paragraph.slice(0, 40)}
                        className="text-sm font-light leading-relaxed text-brand-muted"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              ))}

              <div className="pt-8 border-t border-brand-border space-y-3">
                <p className="text-sm font-light leading-relaxed text-brand-muted">
                  You can reach us on{" "}
                  <a
                    href="tel:+919146238303"
                    className="text-brand-black hover:text-brand-gold transition-colors duration-300"
                  >
                    +91 9146238303
                  </a>{" "}
                  or at{" "}
                  <a
                    href="mailto:info@pinnaclproperties.com"
                    className="text-brand-black hover:text-brand-gold transition-colors duration-300"
                  >
                    info@pinnaclproperties.com
                  </a>
                  .
                </p>
                <p className="text-xs font-light leading-relaxed text-brand-muted/70">
                  This page is written in plain language for clarity. It is not a
                  substitute for professional legal advice, and it has not been
                  drafted or reviewed by a lawyer.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
