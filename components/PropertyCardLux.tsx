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
  meta?: string;
};

export default function PropertyCardLux({ img, slug, tag, title, location, price, meta }: Props) {
  const detailsHref = slug ? `/properties/${encodeURIComponent(slug)}` : "#";

  return (
    <article
      className="group relative overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-500 hover:border-gold/40"
      aria-label={title}
    >
      {/* image */}
      <div className="relative h-72 overflow-hidden">
        <img
          src={img || "/placeholder.svg"}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/10 to-transparent" />

        {tag && (
          <span className="absolute left-4 top-4 rounded-full border border-gold/30 bg-background/60 px-3 py-1 text-xs tracking-wide text-gold backdrop-blur-md">
            {tag}
          </span>
        )}
      </div>

      {/* body */}
      <div className="p-6">
        <h3 className="font-serif text-xl leading-tight text-foreground">{title}</h3>

        {location && (
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gold">
              <path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0118 0z" strokeWidth="1.5" />
              <circle cx="12" cy="10" r="3" strokeWidth="1.5" />
            </svg>
            {location}
          </p>
        )}

        {meta && <p className="mt-3 text-xs uppercase tracking-[0.2em] text-muted">{meta}</p>}

        <div className="mt-5 flex items-center justify-between border-t border-border pt-5">
          <span className="font-serif text-lg text-foreground">{price}</span>
          <Link
            href={detailsHref}
            className="inline-flex items-center gap-2 text-sm font-medium text-gold transition-colors hover:text-gold-soft"
            aria-label={`View details for ${title}`}
          >
            View
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="transition-transform group-hover:translate-x-1">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}
