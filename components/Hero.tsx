```tsx
"use client";

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

      {/* DARK OVERLAY */}
      <div className="absolute inset-0 bg-black/50 z-[1]" />

      {/* CONTENT */}
      <div className="relative z-10 h-full flex items-center justify-center text-center px-6">
        <div className="max-w-3xl animate-fade-in">

          <span className="brand-logo mb-6 block text-[#C8A96B] tracking-[4px]">
            PINNACL PRIVATE ADVISORY
          </span>

          <h1 className="brand-heading mb-6 text-white">
            Where Every Home <br />
            Reflects You
          </h1>

          <p className="brand-body mb-10 text-gray-200">
            Handpicked residences — curated for lifestyle & comfort
          </p>

        </div>
      </div>

    </section>
  );
}
```
