"use client";

import { useState } from "react";

const propertyTypes = ["Residential", "Penthouse", "Commercial"];
const priceBands = ["Any Price", "₹3 Cr +", "₹5 Cr +", "₹10 Cr +"];

export default function LuxurySearchBar() {
  const [type, setType] = useState(propertyTypes[0]);
  const [price, setPrice] = useState(priceBands[0]);

  return (
    <div className="w-full max-w-3xl rounded-2xl border border-border bg-surface/70 backdrop-blur-xl p-3 shadow-2xl">
      {/* Type toggle */}
      <div className="flex flex-wrap items-center gap-1 px-1 pb-3">
        {propertyTypes.map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`rounded-full px-4 py-1.5 text-xs tracking-wide transition-colors ${
              type === t
                ? "bg-gold text-[#0a0a0a]"
                : "text-foreground/60 hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Inputs row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-3 rounded-xl border border-border bg-background/40 px-4 py-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gold shrink-0">
            <path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0118 0z" strokeWidth="1.5" />
            <circle cx="12" cy="10" r="3" strokeWidth="1.5" />
          </svg>
          <input
            type="text"
            placeholder="Search by area — Worli, BKC, Powai…"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
          />
        </div>

        <div className="relative sm:w-44">
          <select
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full appearance-none rounded-xl border border-border bg-background/40 px-4 py-3 text-sm text-foreground/80 outline-none"
            aria-label="Price range"
          >
            {priceBands.map((p) => (
              <option key={p} value={p} className="bg-surface text-foreground">
                {p}
              </option>
            ))}
          </select>
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
          >
            <path d="M6 9l6 6 6-6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <button className="btn-gold sm:px-8" type="button">
          Search
        </button>
      </div>
    </div>
  );
}
