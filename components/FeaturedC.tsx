"use client";

import React, { useState } from "react";
import PropertyCardLux from "./PropertyCardLux";

type Card = {
  img: string;
  slug: string;
  tag: string;
  category: string;
  title: string;
  location: string;
  price: string;
  meta: string;
};

const cards: Card[] = [
  {
    img: "/properties/crest.png",
    slug: "pinnacl-crest-powai",
    tag: "Ready Possession",
    category: "Residences",
    title: "Pinnacl Crest",
    location: "Powai, Mumbai",
    price: "₹3.2 Cr",
    meta: "2 — 3 Bed · 780–1150 sq.ft",
  },
  {
    img: "/properties/aurelia.png",
    slug: "pinnacl-aurelia-bkc",
    tag: "Limited Release",
    category: "Residences",
    title: "Pinnacl Aurelia",
    location: "BKC Annexe, Mumbai",
    price: "₹4.8 Cr",
    meta: "3 Bed · 1050–1350 sq.ft",
  },
  {
    img: "/properties/bayview.png",
    slug: "pinnacl-bayview-worli",
    tag: "Sea Facing",
    category: "Penthouses",
    title: "Pinnacl Bayview",
    location: "Worli Seafront, Mumbai",
    price: "₹6.5 Cr",
    meta: "3 — 4 Bed · 1350–1850 sq.ft",
  },
];

const filters = ["All", "Residences", "Penthouses"];

export default function FeaturedC() {
  const [active, setActive] = useState("All");

  const visible = active === "All" ? cards : cards.filter((c) => c.category === active);

  return (
    <section id="collection" className="container-lux py-24 md:py-32">
      {/* Header */}
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <span className="eyebrow mb-4 block">The Collection</span>
          <h2 className="text-balance text-3xl leading-tight text-foreground md:text-5xl">
            A curated portfolio of rare addresses
          </h2>
        </div>

        {/* Minimalist filter */}
        <div className="flex items-center gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={`rounded-full border px-4 py-2 text-xs tracking-wide transition-colors ${
                active === f
                  ? "border-gold bg-gold text-[#0a0a0a]"
                  : "border-border text-foreground/60 hover:border-gold/40 hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((c) => (
          <PropertyCardLux
            key={c.slug}
            img={c.img}
            slug={c.slug}
            tag={c.tag}
            title={c.title}
            location={c.location}
            price={c.price}
            meta={c.meta}
          />
        ))}
      </div>
    </section>
  );
}
