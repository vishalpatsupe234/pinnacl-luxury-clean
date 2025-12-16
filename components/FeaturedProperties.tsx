"use client";

import React, { useState } from "react";
import Image from "next/image";

const properties = [
  {
    id: 1,
    name: "Pinnacl Crest, Powai",
    location: "Powai, Mumbai",
    price: "₹3.2 Cr onwards",
    tag: "Ready Possession",
    image: "/properties/crest.jpg",
    config: "2 & 3 BHK residences",
    area: "Carpet from approx. 780 – 1150 sq.ft.",
    highlights: [
      "OC received – no GST applicable",
      "Walkable to business, schools & lake-side leisure",
      "Low-density tower with limited apartments",
    ],
  },
  {
    id: 2,
    name: "Pinnacl Aurelia",
    location: "BKC Annexe",
    price: "₹4.8 Cr onwards",
    tag: "Limited Inventory",
    image: "/properties/aurelia.jpg",
    config: "3 BHK premium residences",
    area: "Carpet from approx. 1050 – 1350 sq.ft.",
    highlights: [
      "Close to BKC corporate hub",
      "Club, gym & curated amenities",
      "Ideal for end-use & rental yield both",
    ],
  },
  {
    id: 3,
    name: "Pinnacl Bayview",
    location: "Worli Seafront",
    price: "₹6.5 Cr onwards",
    tag: "Sea Facing",
    image: "/properties/bayview.jpg",
    config: "3 & 4 BHK sea-facing homes",
    area: "Carpet from approx. 1350 – 1850 sq.ft.",
    highlights: [
      "Open sea & skyline views",
      "Deck living with large frontage",
      "Premium address with strong resale value",
    ],
  },
];

const FeaturedProperties: React.FC = () => {
  const [openId, setOpenId] = useState<number | null>(null);

  return (
    <section
      id="projects"
      className="py-20 border-t border-neutral-200/60 bg-[var(--color-brand-bg)]"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Top heading */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[var(--color-brand-muted)]">
              Featured Collection
            </p>
            <h2 className="font-serif text-3xl md:text-4xl mt-2 text-[var(--color-brand-black)]">
              Handpicked Residences
            </h2>
          </div>

          <p className="text-sm text-[var(--color-brand-muted)] max-w-md">
            Personally vetted for location, construction quality and
            long-term livability before it becomes a Pinnacl recommendation.
          </p>
        </div>

        {/* Cards with photos */}
        <div className="grid gap-6 md:grid-cols-3">
          {properties.map((property) => {
            const isOpen = openId === property.id;

            return (
              <article
                key={property.id}
                className="card-surface group hover:-translate-y-1 hover:shadow-lg transition-all overflow-hidden"
              >
                {/* Image */}
                <div className="relative h-44 md:h-48 rounded-2xl overflow-hidden">
                  <Image
                    src={property.image}
                    alt={property.name}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Main content */}
                <div className="pt-4 space-y-3">
                  <span className="inline-flex rounded-full border border-[rgba(200,180,140,0.45)] bg-[rgba(255,255,255,0.75)] px-3 py-1 text-[10px] font-semibold tracking-wide text-[var(--color-brand-gold-soft)] uppercase">
                    {property.tag}
                  </span>

                  <h3 className="font-serif text-lg text-[var(--color-brand-black)]">
                    {property.name}
                  </h3>

                  <p className="text-xs text-[var(--color-brand-muted)]">
                    {property.location}
                  </p>

                  <p className="text-sm font-semibold text-[var(--color-brand-black)]">
                    {property.price}
                  </p>

                  {/* View Details – toggles extra info */}
                  <button
                    type="button"
                    onClick={() =>
                      setOpenId(isOpen ? null : property.id)
                    }
                    className="mt-3 text-xs font-semibold text-[var(--color-brand-gold)] underline underline-offset-4 decoration-[rgba(201,166,106,0.4)] group-hover:decoration-[var(--color-brand-gold)]"
                  >
                    {isOpen ? "Hide Details" : "View Details"}
                  </button>

                  {/* Extra details block */}
                  {isOpen && (
                    <div className="mt-3 border-t border-neutral-200/70 pt-3 text-[11px] space-y-1 text-[var(--color-brand-muted)]">
                      <p>
                        <span className="font-semibold text-[var(--color-brand-black)]">
                          Configuration:
                        </span>{" "}
                        {property.config}
                      </p>
                      <p>
                        <span className="font-semibold text-[var(--color-brand-black)]">
                          Carpet:
                        </span>{" "}
                        {property.area}
                      </p>
                      <ul className="mt-2 space-y-1">
                        {property.highlights.map((point, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="mt-[2px] h-[4px] w-[4px] rounded-full bg-[var(--color-brand-gold)]" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProperties;
