"use client";

import { useEffect, useRef, useState } from "react";
import { TbMessages } from "react-icons/tb";
import PropertyGallery from "./PropertyGallery";
import ReraDisclosure from "./ReraDisclosure";

type Property = {
  title: string;
  city?: string | null;
  locality?: string | null;
  price_display?: string | null;
  highlights?: string[];
  is_featured?: boolean;
  bedrooms?: number | null;
  area_sqft?: number | null;
  project_status?: string | null;
  rera_number?: string | null;
};

const POSSESSION_LABELS: Record<string, string> = {
  ready_to_move: "Ready Possession",
  under_construction: "Under Construction",
  sold_out: "Sold Out",
};

export default function PropertyDetails({
  property,
  images = [],
  slug,
}: {
  property: Property;
  images?: string[];
  slug?: string;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [enquirySubmitted, setEnquirySubmitted] = useState(false);
  const [enquiryError, setEnquiryError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);

  const galleryRef = useRef<HTMLDivElement>(null);
  const enquiryRef = useRef<HTMLDivElement>(null);
  const pastHeroRef = useRef(false);
  const enquiryVisibleRef = useRef(false);

  // The business WhatsApp number already configured in EnquirySection.tsx,
  // Hero.tsx, FloatingAction.tsx and app/contact/page.tsx. This file carried
  // the placeholder "91XXXXXXXXXX", which produced a dead wa.me link. The
  // existing value is reused — no new number is introduced here.
  const whatsappUrl = `https://wa.me/919146238303?text=${encodeURIComponent(
    `Hello, I would like to enquire about ${property.title}.`
  )}`;

  // "Schedule Visit" previously had no onClick and did nothing. It now scrolls
  // to the enquiry form already on this page — the same form both CTAs feed —
  // rather than introducing a booking system. Respects reduced-motion via the
  // browser's own scroll-behavior handling.
  function scrollToEnquiry() {
    enquiryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  useEffect(() => {
    const galleryEl = galleryRef.current;
    const enquiryEl = enquiryRef.current;
    if (!galleryEl || !enquiryEl) return;

    const updateVisibility = () => {
      setShowStickyBar(pastHeroRef.current && !enquiryVisibleRef.current);
    };

    const heroObserver = new IntersectionObserver(
      ([entry]) => {
        pastHeroRef.current = !entry.isIntersecting;
        updateVisibility();
      },
      { threshold: 0 }
    );
    const enquiryObserver = new IntersectionObserver(
      ([entry]) => {
        enquiryVisibleRef.current = entry.isIntersecting;
        updateVisibility();
      },
      { threshold: 0 }
    );

    heroObserver.observe(galleryEl);
    enquiryObserver.observe(enquiryEl);

    return () => {
      heroObserver.disconnect();
      enquiryObserver.disconnect();
    };
  }, []);

  // Previously the response was discarded, so a 400, 429 or 500 still showed
  // the success state. Success is now shown only for a 2xx, the error renders
  // inline instead of via alert(), and the fields are cleared only on success
  // so a failed submission can be retried without retyping.
  async function handleEnquirySubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setEnquiryError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email,
          message,
          location: property.locality || property.city || "",
          propertyId: slug || "",
        }),
      });

      if (!res.ok) {
        setEnquiryError("Something went wrong. Please try again.");
        return;
      }

      setEnquirySubmitted(true);
      setName("");
      setPhone("");
      setEmail("");
      setMessage("");
    } catch {
      setEnquiryError("Something went wrong. Please try again.");
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
    city,
    locality,
    price_display,
    highlights = [],
    is_featured,
    bedrooms,
    area_sqft,
    project_status,
    rera_number,
  } = property;

  return (
    <>
    <section className="section-shell py-16">
      {/* HERO */}
      <div className="grid lg:grid-cols-2 gap-12 items-start">
        {/* IMAGE */}
        <div ref={galleryRef}>
          <PropertyGallery images={images} />
        </div>

        {/* CONTENT */}
        <div>
          {is_featured && (
            <span className="inline-block mb-3 rounded-full bg-[var(--color-brand-bg)] px-4 py-1 text-xs font-medium text-[var(--color-brand-gold)]">
              Featured Property
            </span>
          )}

          <h1 className="text-3xl md:text-4xl font-playfair mb-2">
            {title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 mb-1">
            <p className="text-[var(--color-brand-muted)] flex items-center gap-1.5">
              <span aria-hidden="true">📍</span>
              {locality}
              {city ? `, ${city}` : ""}
            </p>

            {rera_number && (
              <span className="inline-flex items-center rounded-full border border-[var(--color-brand-gold)] px-3 py-0.5 text-[10px] uppercase tracking-[0.15em] text-[var(--color-brand-gold)]">
                MahaRERA {rera_number}
              </span>
            )}
          </div>

          {/* "Verified Luxury Listing" previously rendered here purely
              because rera_number was non-null. Holding a number is not
              verification — the field is free text, has contained
              placeholder values, and no verification is recorded anywhere.
              Factual registration details now render via <ReraDisclosure />
              lower on this page. */}

          <p className="text-xl font-semibold text-[var(--color-brand-gold)] mb-4">
            {price_display}
          </p>

          {(bedrooms || area_sqft || project_status) && (
            <div className="flex flex-wrap gap-2 mb-6">
              {bedrooms != null && (
                <span className="inline-flex items-center rounded-full border border-[var(--color-brand-border)] px-3 py-1 text-xs font-light text-[var(--color-brand-black)]">
                  {bedrooms} BHK
                </span>
              )}
              {area_sqft != null && (
                <span className="inline-flex items-center rounded-full border border-[var(--color-brand-border)] px-3 py-1 text-xs font-light text-[var(--color-brand-black)]">
                  {area_sqft.toLocaleString()} sq.ft
                </span>
              )}
              {project_status && (
                <span className="inline-flex items-center rounded-full border border-[var(--color-brand-border)] px-3 py-1 text-xs font-light text-[var(--color-brand-black)]">
                  {POSSESSION_LABELS[project_status] ?? project_status}
                </span>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button type="button" onClick={scrollToEnquiry} className="btn-gold-outline w-full">
              Schedule Visit
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full px-10 py-3.5 text-xs uppercase tracking-[0.2em] font-light transition-all duration-300 bg-white border border-[var(--color-brand-gold)] text-[var(--color-brand-gold)] hover:bg-[rgba(201,166,106,0.08)]"
            >
              <TbMessages size={16} strokeWidth={1.5} />
              WhatsApp Enquiry
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.12em] text-[var(--color-brand-muted)]">
            <span>Personal Advisory</span>
            <span className="text-[var(--color-brand-gold)]">·</span>
            <span>Prompt Site Visits</span>
            <span className="text-[var(--color-brand-gold)]">·</span>
            <span>Documentation Support</span>
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

        {/* "long-term appreciation" removed: an unqualified forward-looking
            claim about property value, rendered identically on every listing
            with nothing to support it. */}
        <p className="text-[var(--color-brand-muted)] max-w-3xl mb-8 leading-relaxed">
          A thoughtfully crafted residence for professionals and families who
          value location and everyday convenience.
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
      <div ref={enquiryRef} className="mt-20 max-w-2xl">
        {/* Was bg-gradient-to-br from-[var(--color-brand-soft)] to-white:
            --color-brand-soft is not defined in app/globals.css (the real token
            is --color-brand-gold-soft, a solid gold tone, not a surface), and
            gradients are disallowed by the project design rules. Replaced with
            the flat off-white surface token already used site-wide. */}
        <div className="rounded-2xl border border-[var(--color-brand-border)] bg-[var(--color-brand-bg)] p-8 md:p-12">
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
              {enquiryError && (
                <p className="text-xs font-light text-red-700/80">{enquiryError}</p>
              )}
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

      <ReraDisclosure projectReraNumber={rera_number} />
    </section>

    {/* STICKY ENQUIRY BAR */}
    <div
      aria-hidden={!showStickyBar}
      className={`fixed inset-x-0 bottom-0 z-40 transition-all duration-300 ease-out ${
        showStickyBar
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      <div className="section-shell flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-brand-border)] bg-white/95 backdrop-blur-md px-4 py-3 md:px-8 md:py-4">
        <div className="min-w-0">
          <p className="hidden sm:block truncate text-sm font-playfair text-[var(--color-brand-black)]">
            {title}
          </p>
          <p className="text-sm md:text-base font-semibold text-[var(--color-brand-gold)]">
            {price_display}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 shrink-0">
          <button type="button" onClick={scrollToEnquiry} className="btn-gold-outline">
            Schedule Visit
          </button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-10 py-3.5 text-xs uppercase tracking-[0.2em] font-light transition-all duration-300 bg-white border border-[var(--color-brand-gold)] text-[var(--color-brand-gold)] hover:bg-[rgba(201,166,106,0.08)]"
          >
            <TbMessages size={16} strokeWidth={1.5} />
            WhatsApp
          </a>
        </div>
      </div>
    </div>
    </>
  );
}
