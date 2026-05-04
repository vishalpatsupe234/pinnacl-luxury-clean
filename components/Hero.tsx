export default function Hero() {
  return (
    <section className="relative h-screen overflow-hidden">
      
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="hero-video"
      >
        <source src="/videos/hero.mp4" type="video/mp4" />
      </video>

      {/* Dark Overlay */}
      <div className="hero-overlay" />

      {/* Hero Content */}
      <div className="relative z-10 h-full flex items-center justify-center text-center px-4">
        <div>
          <span className="brand-logo block mb-6">
            PINNACL PRIVATE ADVISORY
          </span>

          <h1 className="brand-heading mb-6">
            Where Every Home <br /> Reflects You
          </h1>

          <p className="brand-body max-w-2xl mx-auto mb-10">
            Handpicked residences — curated for lifestyle, comfort,
            legal clarity, and long-term value.
          </p>
        </div>
      </div>

    </section>
  );
}