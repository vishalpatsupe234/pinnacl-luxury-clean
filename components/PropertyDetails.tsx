"use client";

import Image from "next/image";
import { useState } from "react";
import { TbMessages } from "react-icons/tb";

type Property = {
  title: string;
  location?: {
    area?: string;
    city?: string;
  };
  priceDisplay?: string;
  images?: string[];
  highlights?: string[];
  isFeatured?: boolean;
};

export default function PropertyDetails({
  property,
  slug,
}: {
  property: Property;
  slug?: string;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [enquirySubmitted, setEnquirySubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleEnquirySubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email,
          message,
          location: property.location?.area || property.location?.city || "",
          propertyId: slug || "",
        }),
      });
      setEnquirySubmitted(true);
      setName("");
      setPhone("");
      setEmail("");
      setMessage("");
    } catch (err) {
      console.error(err);
      alert("Error sending enquiry. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  if (!property) {
    return (
      <div className="py-20 text-center text-gray-500">
        Property details not available.
      </div>
    );
  }

  const {
    title,
    location,
    priceDisplay,
    images = [],
    highlights = [],
    isFeatured,
  } = property;

  return (
    <section className="section-shell py-16">
      {/* HERO */}
      <div className="grid lg:grid-cols-2 gap-12 items-start">
        {/* IMAGE */}
        <div className="relative w-full h-[420px] rounded-2xl overflow-hidden bg-gray-100">
          {images[0] && (
            <Image
              src={images[0]}
              alt={title}
              fill
              priority
              className="object-cover"
            />
          )}
        </div>

        {/* CONTENT */}
        <div>
          {isFeatured && (
            <span className="inline-block mb-3 rounded-full bg-[var(--color-brand-soft)] px-4 py-1 text-xs font-medium text-[var(--color-brand-gold)]">
              Featured Property
            </span>
          )}

          <h1 className="text-3xl md:text-4xl font-playfair mb-2">
            {title}
          </h1>

          <p className="text-[var(--color-brand-muted)] mb-4">
            {location?.area}
            {location?.city ? `, ${location.city}` : ""}
          </p>

          <p className="text-xl font-semibold text-[var(--color-brand-gold)] mb-6">
            {priceDisplay}
          </p>

          <div className="flex flex-col items-start gap-4">
            <button type="button" className="btn-gold-outline">
              Schedule Visit
            </button>
            <a
              href="https://wa.me/91XXXXXXXXXX"
              target="_blank"
              rel="noopener noreferrer"
              className="relative inline-flex items-center gap-1.5 text-xs font-light uppercase tracking-[0.15em] text-brand-gold/70 transition-colors duration-300 after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:bg-brand-gold/40 after:transition-colors after:duration-300 hover:text-brand-gold hover:after:bg-brand-gold"
            >
              <TbMessages size={16} strokeWidth={1.5} />
              WhatsApp Enquiry
            </a>
          </div>
        </div>
      </div>

      {/* HIGHLIGHTS */}
      {highlights.length > 0 && (
        <div className="mt-12 grid md:grid-cols-2 gap-6 max-w-4xl">
          {highlights.map((point, i) => (
            <div
              key={i}
              className="rounded-xl border bg-white px-6 py-4"
            >
              {point}
            </div>
          ))}
        </div>
      )}

      {/* WHY THIS PROPERTY */}
      <div className="mt-20 max-w-5xl">
        <h2 className="text-2xl md:text-3xl font-playfair mb-4">
          Why {title}
        </h2>

        <p className="text-[var(--color-brand-muted)] max-w-3xl mb-8 leading-relaxed">
          A thoughtfully crafted residence for professionals and families who
          value location, long-term appreciation, and everyday convenience.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-xl border bg-white p-6">
            Prime location with excellent connectivity to key business and
            lifestyle hubs.
          </div>

          <div className="rounded-xl border bg-white p-6">
            Clear ownership and compliance-driven project with long-term
            peace of mind.
          </div>

          <div className="rounded-xl border bg-white p-6">
            Strong rental and resale demand in a consistently performing
            micro-market.
          </div>
        </div>
      </div>

      {/* ENQUIRY FORM */}
      <div className="mt-20 max-w-2xl">
        <div className="rounded-2xl border bg-gradient-to-br from-[var(--color-brand-soft)] to-white p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-playfair mb-2">
            Enquire About {title}
          </h2>
          <p className="text-[var(--color-brand-muted)] mb-8">
            Let us know you&apos;re interested. We&apos;ll reach out with details and next steps.
          </p>

          {enquirySubmitted ? (
            <div className="p-6 rounded-xl bg-green-50 text-green-800 text-center">
              <p className="font-medium">Thank you for your enquiry.</p>
              <p className="text-sm mt-2">We&apos;ll contact you shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleEnquirySubmit} className="space-y-4">
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-gold)]"
              />
              <input
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-gold)]"
              />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-gold)]"
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Any questions or preferences?"
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-gold)] resize-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[var(--color-brand-gold)] text-white font-medium py-3 hover:bg-opacity-90 disabled:opacity-50"
              >
                {loading ? "Sending…" : "Send Enquiry"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
