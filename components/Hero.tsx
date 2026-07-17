"use client";

import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-brand-black">
      <video
        src="/videos/hero.mp4"
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      />

      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,17,17,0.82)_0%,rgba(17,17,17,0.56)_34%,rgba(17,17,17,0.28)_62%,rgba(17,17,17,0.45)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,17,17,0.06)_0%,rgba(17,17,17,0.18)_42%,rgba(17,17,17,0.72)_100%)]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center px-6 pb-16 pt-24 sm:px-8 md:px-10 lg:px-12">
        <div className="grid w-full max-w-3xl gap-8 md:gap-10">
          <div className="text-center md:text-left animate-fade-in">
            <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.42em] text-white/68">
              Pinnacl Properties
            </p>

            <h1 className="font-serif text-4xl leading-[1.04] text-white sm:text-5xl lg:text-6xl xl:text-7xl">
              Curated
              <span className="block text-brand-gold">Luxury Living</span>
              in Mumbai
            </h1>

            <p className="mt-6 max-w-2xl text-sm font-light leading-7 text-white/72 sm:text-base lg:text-lg">
              Discover signature residences in Mumbai&apos;s most desirable addresses,
              backed by trusted guidance, transparent pricing, and private viewings.
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center md:justify-start">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full bg-brand-gold px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.2em] text-brand-black shadow-[0_10px_30px_-12px_rgba(201,166,106,0.8)] transition-all duration-300 hover:bg-brand-gold/90"
            >
              Schedule a Private Tour
            </Link>

            <Link
              href="/properties"
              className="inline-flex items-center justify-center rounded-full border border-white/35 bg-white/10 px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-sm transition-all duration-300 hover:border-brand-gold hover:text-brand-gold"
            >
              Explore Properties
            </Link>
          </div>

          <ul className="flex flex-wrap justify-center gap-3 md:justify-start">
            <li className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/80 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-brand-gold" />
              RERA Verified
            </li>
            <li className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/80 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-brand-gold" />
              Private Site Visits
            </li>
            <li className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/80 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-brand-gold" />
              Tailored Advisory
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
