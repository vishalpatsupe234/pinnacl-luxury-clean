"use client";

import LuxurySearchBar from "./LuxurySearchBar";

export default function Hero() {
  return (
    <section className="relative h-screen overflow-hidden">

      {/* VIDEO */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
        onLoadedMetadata={(e) => {
          e.currentTarget.playbackRate = 0.6;
        }}
      >
        <source src="/videos/hero.mp4" type="video/mp4" />
      </video>

      {/* OVERLAY */}
      <div className="absolute inset-0 bg-black/50" />

      {/* CONTENT */}
      <div className="relative z-10 h-full flex items-center justify-center text-center px-6">
        <div className="max-w-4xl animate-fade-in">

          <h1
            className="mb-6 text-5xl md:text-7xl font-semibold text-white"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Where Every Home
            <br />
            Reflects You
          </h1>

          <p className="brand-body mb-8">
  Handpicked residences — curated for lifestyle & comfort
</p>

<LuxurySearchBar />

        </div>
      </div>

    </section>
  );
}