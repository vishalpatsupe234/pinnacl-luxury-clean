import Link from "next/link";
import LuxurySearchBar from "./LuxurySearchBar";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* BACKGROUND VIDEO */}
      <div className="absolute inset-0 -z-10">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="hero-video"
        >
          <source src="/video/hero.mp4" type="video/mp4" />
        </video>

        {/* Dark luxury overlay */}
        <div className="absolute inset-0 bg-black/45" />
      </div>

      {/* CONTENT */}
      <div className="section-shell pt-32 pb-24 w-full">
        <div className="max-w-4xl mx-auto text-center">
          {/* Brand */}
          <span className="brand-logo mb-6 block">
            Pinnacl Private Advisory
          </span>

          {/* Heading */}
          <h1 className="brand-heading font-playfair mb-6">
            Where Every Home <br /> Reflects You
          </h1>

          {/* Sub text */}
          <p className="brand-body mb-10 max-w-2xl mx-auto">
            Handpicked residences — curated for lifestyle, comfort,
            legal clarity, and long-term value.
          </p>

          {/* SEARCH BAR */}
          <div className="flex justify-center">
            <LuxurySearchBar />
          </div>

          {/* Trust badges */}
          <div className="mt-8 flex justify-center gap-6 text-xs text-white/80">
            <span>✓ RERA Verified</span>
            <span>✓ Trusted by 500+ Families</span>
          </div>
        </div>
      </div>
    </section>
  );
}
