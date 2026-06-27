// components/FeaturedA.tsx
import React from "react";

export default function FeaturedA() {
  const items = [
    { title: "Pinnacl Crest, Powai", location: "Powai, Mumbai", price: "3.2 Cr onwards", img: "/properties/crest.jpg" },
    { title: "Pinnacl Aurelia", location: "BKC Annexe", price: "4.8 Cr onwards", img: "/properties/aurelia.jpg" },
    { title: "Pinnacl Bayview", location: "Worli Seafront", price: "6.5 Cr onwards", img: "/properties/bayview.jpg" },
  ];

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-xs uppercase tracking-widest text-neutral-500 mb-4">Featured Collection</h2>
        <h3 className="text-3xl md:text-4xl font-semibold mb-8">Luxury Boost — Variant A</h3>

        <div className="grid gap-8 grid-cols-1 md:grid-cols-3">
          {items.map((it) => (
            <article key={it.title} className="bg-white rounded-2xl overflow-hidden shadow-card-a border border-transparent hover:border-[rgba(201,166,106,0.12)] transition-all">
              <div className="h-44 w-full overflow-hidden">
                <img src={it.img} alt={it.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-6">
                <div className="mb-2 text-xs text-neutral-400 font-medium">Ready Possession</div>
                <h4 className="text-lg font-semibold text-[#111]">{it.title}</h4>
                <p className="text-sm text-neutral-500 mt-1">{it.location}</p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm font-semibold text-[#111]">₹{it.price}</div>
                  <a className="text-[var(--color-brand-gold)] font-medium" href="#">View Details</a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
