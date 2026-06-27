import LuxurySearchBar from "./LuxurySearchBar";

export default function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Background image */}
      <img
        src="/properties/hero-residence.png"
        alt="Luxury penthouse interior overlooking the city skyline at dusk"
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Cinematic gradient overlays for legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/45 to-background" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-transparent" />

      {/* Content */}
      <div className="container-lux relative z-10 flex min-h-screen flex-col justify-end pb-16 pt-32 md:justify-center md:pb-0">
        <div className="max-w-3xl">
          <span className="eyebrow animate-fade-in mb-6 block">
            Pinnacl Estate — Private Advisory
          </span>

          <h1 className="animate-fade-in delay-1 text-balance text-4xl leading-[1.05] text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            Residences for a life
            <br />
            <span className="text-gold">few will ever know.</span>
          </h1>

          <p className="animate-fade-in delay-2 mt-7 max-w-xl text-pretty text-base leading-relaxed text-foreground/70 md:text-lg">
            A discreet collection of the most exceptional homes across Mumbai —
            curated for those who measure value in rarity, not numbers.
          </p>

          {/* Search */}
          <div className="animate-fade-in delay-3 mt-10">
            <LuxurySearchBar />
          </div>

          {/* Trust stats */}
          <div className="animate-fade-in delay-3 mt-12 flex flex-wrap gap-x-12 gap-y-6 border-t border-border pt-8">
            {[
              { value: "₹4,200 Cr", label: "Residences placed" },
              { value: "120+", label: "Private listings" },
              { value: "18 yrs", label: "Quiet expertise" },
            ].map((s) => (
              <div key={s.label}>
                <div className="font-serif text-2xl text-foreground md:text-3xl">{s.value}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.25em] text-muted">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
