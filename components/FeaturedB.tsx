// components/FeaturedB.tsx
import React from "react";

export default function FeaturedB() {
  const items = [
    { title: "Handpicked Residences", subtitle: "Curated for lifestyle & comfort", price: "3.2 Cr onwards", img: "/properties/crest.jpg" },
    { title: "Urban Luxury", subtitle: "City-view apartments", price: "4.8 Cr onwards", img: "/properties/aurelia.jpg" },
    { title: "Seaside Collection", subtitle: "Premium waterfront homes", price: "6.5 Cr onwards", img: "/properties/bayview.jpg" },
  ];

  return (
    <section className="py-14 bg-[linear-gradient(180deg,#F8F7F3,#F3EFE7)]">
      <div className="max-w-6xl mx-auto px-6">
        <h3 className="text-3xl font-serif mb-8">Minimal High-End — Variant B</h3>
        <div className="grid gap-8 grid-cols-1 md:grid-cols-3">
          {items.map(it => (
            <article key={it.title} className="rounded-lg p-6 hover:bg-white/80 transition-colors">
              <div className="rounded-md overflow-hidden mb-5 h-40">
                <img src={it.img} alt={it.title} className="w-full h-full object-cover" />
              </div>
              <h4 className="text-2xl font-serif text-[#111] mb-1">{it.title}</h4>
              <p className="text-sm text-neutral-500 mb-4">{it.subtitle}</p>
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold">₹{it.price}</div>
                <a href="#" className="text-[var(--color-brand-gold)] underline">View Details</a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
