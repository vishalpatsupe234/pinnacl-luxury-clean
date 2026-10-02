import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pinnaclproperties.com";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What personal information the Pinnacl Properties website collects when you send an enquiry, how it is used, and how to contact us about it.",
  alternates: { canonical: `${siteUrl}/privacy` },
  openGraph: {
    title: "Privacy | Pinnacl Properties",
    description:
      "What personal information the Pinnacl Properties website collects, how it is used, and how to contact us about it.",
    url: `${siteUrl}/privacy`,
  },
};

// Privacy notice.
//
// EVERY STATEMENT ON THIS PAGE WAS VERIFIED AGAINST THE IMPLEMENTATION before
// being written. Specifically, from app/api/leads/route.ts and the live
// deployment on 2026-10-02:
//
//   * fields collected  — name, phone, email, location, message, and the
//                         property slug when the enquiry comes from a
//                         property page (MAX_LENGTHS / LeadFields)
//   * database          — public.leads: buyer_name, buyer_phone, buyer_email,
//                         message (location appended), property_id,
//                         lead_source = 'website'
//   * backup            — one row appended to a Google Sheet (SHEET_HEADERS)
//   * email             — one notification to OWNER_NOTIFICATION_EMAIL with the
//                         enquiry details; one acknowledgement to the sender,
//                         containing their name only. Both via Resend
//   * IP address        — read from x-forwarded-for for rate limiting only,
//                         held in a module-scope Map, never written to the
//                         database (getClientKey / rateLimitStore)
//   * change log        — redact_audit_pii() strips buyer_name, buyer_phone,
//                         buyer_email and message from audit_log entries
//   * cookies/tracking  — verified: zero Set-Cookie headers on /, /about and
//                         /contact; no analytics or tracking script anywhere
//
// DELIBERATELY NOT STATED, because none of it could be verified: retention
// periods, security certifications, encryption specifics, where each provider
// stores data, international transfers, cookie categories, or any practice the
// code does not actually perform. If a claim could not be verified it is absent
// rather than softened.

const SECTIONS: { heading: string; body: string[] }[] = [
  {
    heading: "What this page covers",
    body: [
      "This page explains what personal information the Pinnacl Properties website collects, what we do with it, and how to reach us about it. It describes how the website works today. If that changes, this page will be updated.",
    ],
  },
  {
    heading: "What we collect when you send an enquiry",
    body: [
      "The enquiry forms on this website ask for your name, your phone number, your email address, the location you are interested in, and whatever you choose to tell us in the message field. Not every field is required on every form.",
      "If you send the enquiry from a property page, we also record which property it came from.",
      "We do not ask for, and the forms do not collect, any identity document, financial account detail, or any other category of sensitive information.",
    ],
  },
  {
    heading: "What we do with it",
    body: [
      "We use it to reply to you and to discuss your enquiry. That is the only reason we ask for it.",
      "Your enquiry is saved in our own customer records so that we can keep track of it, know who has responded, and remember what you are looking for if we speak again. A copy is also written to a spreadsheet we keep as an operational backup.",
      "When an enquiry arrives, an email notification is sent to us containing what you submitted. If you gave an email address, you also receive a short acknowledgement confirming that we have your enquiry. It contains your name and nothing else about you.",
      "We do not use your details for marketing campaigns, we do not add you to a mailing list, and we do not sell or rent your information to anyone.",
    ],
  },
  {
    heading: "Information we may add if we speak with you",
    body: [
      "If we have a conversation about what you are looking for, we may record it alongside your enquiry — for example a budget range, the configuration or locality you prefer, whether the purchase is to live in or to invest, your timeline, and how you plan to fund it. We may also record notes from our conversations and any site visit we arrange.",
      "This exists so that you do not have to repeat yourself, and so that whoever you speak to next already knows your position.",
    ],
  },
  {
    heading: "Where it is held",
    body: [
      "Our customer records are held in a hosted database provided by Supabase. The operational backup is a Google spreadsheet. Email is sent through Resend. The website itself is hosted by Vercel. We use these services to run the website and our own records; we do not share your information with them for any purpose of their own.",
      "Access to our customer records is restricted to Pinnacl Properties accounts that we create and approve individually. There is no public sign-up.",
    ],
  },
  {
    heading: "Your IP address",
    body: [
      "When a form is submitted, the server reads the submitting IP address to limit how many enquiries can be sent from one place in a short period. This is to prevent abuse of the form. It is held briefly in the server's memory and is not written to our customer records.",
    ],
  },
  {
    heading: "Cookies and tracking",
    body: [
      "The public pages of this website do not set cookies, and we have not installed any analytics or visitor-tracking service. We do not build a profile of your browsing.",
      "The private sections used by Pinnacl Properties staff to sign in do use a session cookie, but only for the person signing in.",
    ],
  },
  {
    heading: "How long we keep it",
    body: [
      "We have not set a fixed period after which enquiries are deleted, and we would rather say that plainly than quote a figure we do not actually apply. In practice we keep an enquiry for as long as it may still be relevant to a conversation with you.",
      "If you would like your details removed, tell us and we will remove them from the records we use.",
    ],
  },
  {
    heading: "Asking us about your information",
    body: [
      "You can ask us what information we hold about you, ask us to correct it, or ask us to remove it. Use the phone number or email address below and we will deal with it directly.",
      "If something on this page does not match your experience of how we have handled your information, please tell us.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-bg text-brand-black">
        <section className="section-shell py-24 md:py-32">
          <div className="max-w-2xl">
            <p className="section-label mb-4">Legal</p>
            <h1 className="section-heading mb-6">Privacy</h1>
            <p className="section-body mb-16">
              What we collect when you send an enquiry, what we do with it, and
              how to reach us about it.
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
                  To ask anything about your personal information, contact us on{" "}
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
                  This page is written in plain language to describe what the
                  website actually does. It is not a substitute for professional
                  legal advice, and it has not been drafted or reviewed by a
                  lawyer.
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
