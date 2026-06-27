// components/PropertyCardB.tsx
import React from "react";

type Props = {
  title: string;
  subtitle?: string;
  price?: string;
  img: string;
};

export default function PropertyCardB({ title, subtitle, price, img }: Props) {
  return (
    <article className="rounded-lg p-6 hover:bg-white/80 transition-colors duration-300">
      <div className="rounded-md overflow-hidden mb-5 h-40">
        <img src={img} alt={title} className="w-full h-full object-cover" />
      </div>

      <h4 className="text-2xl font-serif text-[#111] mb-1">{title}</h4>
      {subtitle && <p className="text-sm text-neutral-500 mb-4">{subtitle}</p>}

      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">₹{price}</div>
        <a href="#" className="text-[var(--color-brand-gold)] underline">View Details</a>
      </div>
    </article>
  );
}
