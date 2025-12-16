import React from "react";

const CTA: React.FC = () => {
  return (
    <section
      id="cta"
      className="relative py-20 bg-brand-black text-white border-t border-white/10"
    >
      {/* Gold overlay glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-gold/5 via-black to-black opacity-40 pointer-events-none" />

      <div className="relative mx-auto w-full max-w-4xl px-6 text-center space-y-6">
        <p className="text-xs font-semibold tracking-[0.25em] uppercase text-brand-gold">
          Book Your Private Consultation
        </p>

        <h2 className="font-serif text-3xl md:text-4xl leading-tight">
          Let's find a home that reflects  
          <span className="text-brand-gold"> you.</span>
        </h2>

        <p className="text-sm md:text-base text-neutral-300 max-w-xl mx-auto">
          Speak one-on-one with a trusted Pinnacl advisor.  
          Get curated recommendations based on lifestyle, location preference,
          and long-term value.
        </p>

        <div className="flex items-center justify-center gap-4 pt-4">
          <a
            href="#contact"
            className="px-8 py-3 rounded-full bg-brand-gold text-brand-black text-sm font-semibold tracking-wide hover:bg-brand-gold/90 transition shadow-md"
          >
            Schedule a Visit
          </a>

          <a
            href="#contact"
            className="text-sm text-neutral-300 underline underline-offset-4 hover:text-white transition"
          >
            Contact Advisor
          </a>
        </div>
      </div>
    </section>
  );
};

export default CTA;