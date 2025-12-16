// components/FeaturedC.tsx
"use client";

import React from "react";
import PropertyCardLux from "./PropertyCardLux";

export default function FeaturedC() {
  const cards = [
    {
      img: "/properties/crest.jpg",
      tag: "Ready Possession",
      title: "Pinnacl Crest, Powai",
      location: "Powai, Mumbai",
      price: "₹3.2 Cr onwards",
    },
    {
      img: "/properties/aurelia.jpg",
      tag: "Limited",
      title: "Pinnacl Aurelia",
      location: "BKC Annexe",
      price: "₹4.8 Cr onwards",
    },
    {
      img: "/properties/bayview.jpg",
      tag: "Sea Facing",
      title: "Pinnacl Bayview",
      location: "Worli Seafront",
      price: "₹6.5 Cr onwards",
    },
  ];

  return (
    <section className="section-shell py-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-wider text-neutral-500">
            Featured Collection
          </p>
          <h2 className="text-3xl md:text-4xl font-playfair font-semibold mt-2">
            Ultra Luxury — Variant C (Hybrid)
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {cards.map((c) => (
            <PropertyCardLux
              key={c.title}
              img={c.img}
              tag={c.tag}
              title={c.title}
              location={c.location}
              price={c.price}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
