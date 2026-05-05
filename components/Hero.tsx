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
      >
        <source src="/videos/hero.mp4" type="video/mp4" />
      </video>

      {/* OVERLAY */}
      <div className="absolute inset-0 bg-black/50" />

      {/* CONTENT */}
      <div className="relative z-10 h-full flex items-center justify-center text-center px-6">
        <div className="max-w-3xl animate-fade-in">

          <span className="brand-logo mb-6 block">
            PINNACL PRIVATE ADVISORY
          </span>

          <h1 className="brand-heading mb-6">
            Where Every Home <br />
            Reflects You
          </h1>

          <p className="brand-body mb-10">
            Handpicked residences — curated for lifestyle, comfort,
            legal clarity, and long-term value.
          </p>

        </div>
      </div>

    </section>
  );
}