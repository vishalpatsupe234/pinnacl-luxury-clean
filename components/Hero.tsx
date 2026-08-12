"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TbBrandWhatsapp } from "react-icons/tb";

const WHATSAPP_NUMBER = "919146238303";
const PROPERTY_TYPES = ["Residential", "Commercial"] as const;
type PropertyType = (typeof PROPERTY_TYPES)[number];

export default function Hero() {
  const router = useRouter();
  const [propertyType, setPropertyType] = useState<PropertyType>("Residential");
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("type", propertyType);
    if (query.trim()) params.set("search", query.trim());
    router.push(`/properties?${params.toString()}`);
  }

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "Hello, I would like to enquire about luxury properties with Pinnacl Properties."
  )}`;

  return (
    <section className="relative isolate flex min-h-screen w-full items-center justify-center bg-brand-black px-6 sm:px-8 md:px-10 lg:px-12">
      <div className="w-full max-w-xl animate-fade-in">
        <p className="mb-10 text-center text-[11px] font-semibold uppercase tracking-[0.4em] text-white/50 md:mb-12">
          Pinnacl Properties
        </p>

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-8 md:flex-row md:items-stretch md:gap-0 md:border-b md:border-white/15 md:pb-5 md:transition-colors md:focus-within:border-brand-gold/50">
            {/* Property type */}
            <div
              role="radiogroup"
              aria-label="Property type"
              className="flex items-center justify-center gap-8 border-b border-white/15 pb-4 focus-within:border-brand-gold/50 md:justify-start md:border-b-0 md:border-r md:border-white/15 md:pb-0 md:pr-8 md:focus-within:border-white/15"
            >
              {PROPERTY_TYPES.map((option) => {
                const active = propertyType === option;
                return (
                  <label key={option} className="cursor-pointer">
                    <input
                      type="radio"
                      name="propertyType"
                      value={option}
                      checked={active}
                      onChange={() => setPropertyType(option)}
                      className="peer sr-only"
                    />
                    <span
                      className={`rounded-sm border-b-2 pb-1 text-sm tracking-wide transition-colors duration-300 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-gold peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-brand-black md:text-base ${
                        active
                          ? "border-brand-gold text-white"
                          : "border-transparent text-white/40 hover:text-white/70"
                      }`}
                    >
                      {option}
                    </span>
                  </label>
                );
              })}
            </div>

            {/* Search field */}
            <div className="border-b border-white/15 pb-4 transition-colors duration-300 focus-within:border-brand-gold/50 md:flex-1 md:border-b-0 md:pb-0 md:pl-8 md:focus-within:border-white/15">
              <label htmlFor="hero-search" className="sr-only">
                Search by city or project
              </label>
              <input
                id="hero-search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="City or Project"
                className="w-full bg-transparent text-center text-lg font-light text-white outline-none placeholder:text-white/40 md:text-left md:text-xl"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-center md:justify-end">
            <button
              type="submit"
              className="rounded-sm bg-brand-gold px-9 py-3 text-xs font-medium uppercase tracking-[0.2em] text-brand-black transition-colors duration-300 hover:bg-brand-gold/90"
            >
              Explore
            </button>
          </div>
        </form>
      </div>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-gold text-brand-black shadow-[0_8px_20px_-6px_rgba(0,0,0,0.35)] transition-transform duration-300 hover:scale-105 md:bottom-auto md:right-10 md:top-1/2 md:-translate-y-1/2"
      >
        <TbBrandWhatsapp size={26} strokeWidth={1.5} />
      </a>
    </section>
  );
}
