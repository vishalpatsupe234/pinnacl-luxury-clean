"use client";

import Link from "next/link";
import HeroMedia from "./HeroMedia";

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-brand-black">
      <HeroMedia
        type="image"
        src="/hero.jpg"
        alt="Premium architectural luxury residence"
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(17,17,17,0.65),transparent_35%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,17,17,0.24)_0%,rgba(17,17,17,0.8)_100%)]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-6 py-24 sm:px-8 md:px-10 lg:px-12">
        <div className="w-full max-w-3xl text-center text-white animate-fade-in">
          <p className="mb-8 text-xs font-semibold uppercase tracking-[0.42em] text-white/70">
            Pinnacl Properties
          </p>

          <h1 className="font-serif text-4xl leading-[0.98] tracking-[-0.02em] text-white sm:text-5xl lg:text-6xl xl:text-7xl">
            Where Every Home
            <span className="block text-brand-gold">Reflects You</span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-sm uppercase tracking-[0.3em] text-white/70 sm:text-base lg:text-lg">
            Luxury. Trust. Simplicity. Transparency.
          </p>

          <div className="mt-12 flex justify-center">
            <Link
              href="/projects"
              className="inline-flex w-full max-w-[420px] items-center justify-center rounded-full bg-brand-gold px-12 py-5 text-sm font-semibold uppercase tracking-[0.25em] text-brand-black shadow-[0_24px_80px_-36px_rgba(201,166,106,0.9)] transition duration-300 hover:bg-brand-gold/90"
            >
              Explore Properties
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
