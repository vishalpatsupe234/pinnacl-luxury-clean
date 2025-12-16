// components/PropertyCardLux.tsx
"use client";

import React from "react";
import Link from "next/link";

type Props = {
  img: string;
  slug?: string;
  tag?: string;
  title: string;
  location?: string;
  price?: string;
};

export default function PropertyCardLux({ img, slug, tag, title, location, price }: Props) {
  // use encodeURIComponent to make slug safe for URL
  const detailsHref = slug ? `/properties/${encodeURIComponent(slug)}` : "#";

  return (
    <article
      className="property-card-lux group relative overflow-hidden rounded-2xl shadow-xl transition-transform duration-300 will-change-transform"
      role="article"
      aria-label={title}
    >
      {/* image */}
      <div className="img-wrap relative h-56 md:h-60 overflow-hidden rounded-t-2xl">
        <img
          src={img}
          alt={title}
          className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />

        {/* soft white glow at top-right (shimmer) */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="img-sheen" />
        </div>
      </div>

      {/* body */}
      <div className="p-6 md:p-7 card-body">
        {tag && (
          <div className="tag inline-block mb-3 rounded-full px-3 py-1 text-xs font-semibold bg-[rgba(201,166,106,0.12)] text-[var(--color-brand-gold)]">
            {tag}
          </div>
        )}

        <h4 className="text-lg md:text-xl font-playfair font-semibold leading-tight text-[rgba(12,12,12,0.95)]">
          {title}
        </h4>

        {location && (
          <p className="location mt-2 text-sm text-neutral-500">{location}</p>
        )}

        <div className="mt-4 flex items-center justify-between gap-4">
          <span className="price font-semibold text-base md:text-lg text-[rgba(12,12,12,0.95)]">
            {price}
          </span>

          {slug ? (
            <Link
              href={detailsHref}
              className="details-link text-[var(--color-brand-gold)] font-medium inline-flex items-center gap-2 transition-colors duration-200"
              aria-label={`View details for ${title}`}
            >
              View Details
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="inline-block">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          ) : (
            <span className="details-link text-[var(--color-brand-gold)] font-medium inline-flex items-center gap-2 transition-colors duration-200">
              View Details
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="inline-block">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
