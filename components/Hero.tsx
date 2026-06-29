"use client";

import Image from "next/image";
import Link from "next/link";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2400&q=80";

export default function Hero() {
  return (
    <section className="relative h-[100vh] min-h-[600px] overflow-hidden">
      <Image
        src={HERO_IMAGE}
        alt="Luxury residence"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />

      <div className="absolute inset-0 bg-black/55" />

      <div className="relative z-10 h-full flex items-center justify-center text-center px-6">
        <div className="max-w-3xl animate-fade-in">
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-normal text-white leading-[1.08]">
            Where Every Home
            <br />
            Reflects You
          </h1>

          <p className="mt-8 text-sm md:text-base font-light tracking-[0.18em] text-white/70 uppercase">
            Luxury. Trust. Simplicity. Transparency.
          </p>

          <div className="mt-12">
            <Link href="/projects" className="btn-gold-outline">
              Explore Properties
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
