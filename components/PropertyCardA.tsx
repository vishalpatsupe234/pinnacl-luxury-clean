// components/PropertyCardA.tsx
import React from "react";

type Props = {
  title: string;
  location?: string;
  price?: string;
  tag?: string;
  img: string;
};

export default function PropertyCardA({ title, location, price, tag, img }: Props) {
  return (
    <article className="bg-white rounded-2xl overflow-hidden shadow-card-a border border-transparent hover:border-[rgba(201,166,106,0.12)] transition-all">
      <div className="h-44 w-full overflow-hidden rounded-t-2xl">
        <img src={img} alt={title} className="w-full h-full object-cover" />
      </div>

      <div className="p-6">
        {tag && <div className="text-xs text-neutral-400 font-medium mb-2">{tag}</div>}
        <h4 className="text-lg font-semibold text-[#111]">{title}</h4>
        {location && <p className="text-sm text-neutral-500 mt-1">{location}</p>}

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm font-semibold text-[#111]">₹{price}</div>
          <a className="text-[var(--color-brand-gold)] font-medium" href="#">View Details</a>
        </div>
      </div>
    </article>
  );
}
