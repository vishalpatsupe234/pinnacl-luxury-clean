import React from "react";
import Image from "next/image";

const AboutPinnacl: React.FC = () => {
  return (
<section
  id="about"
  className="bg-white text-brand-black py-20 border-t border-neutral-200/70"
>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">

          {/* Left: Image */}
          <div className="rounded-3xl overflow-hidden shadow-lg">
            <div className="relative h-72 md:h-96 w-full bg-gray-100">
              <Image
                src="/about-1.jpg"
                alt="Pinnacl Properties - Team & Projects"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>

          {/* Right: Content */}
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-brand-grey">
              About Pinnacl
            </p>

            <h2 className="font-serif text-3xl md:text-4xl mt-3 text-brand-black">
              We curate homes that reflect your life
            </h2>

            <p className="mt-4 text-sm text-brand-grey max-w-xl leading-relaxed">
              Pinnacl Properties is a boutique real-estate curation firm focused on
              discerning buyers in Mumbai. We combine on-ground research, builder
              verification and long-term value assessment to present a short list
              of properties that truly fit your lifestyle and financial goals.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-4 mt-6">
              <div className="flex-1 min-w-[140px] bg-brand-bg rounded-2xl p-4 border border-neutral-200/60">
                <div className="text-xs text-brand-grey uppercase font-semibold">Years</div>
                <div className="mt-2 text-2xl font-bold text-brand-black">8+</div>
                <div className="text-xs text-brand-grey">Market experience</div>
              </div>
              <div className="flex-1 min-w-[140px] bg-brand-bg rounded-2xl p-4 border border-neutral-200/60">
                <div className="text-xs text-brand-grey uppercase font-semibold">Projects</div>
                <div className="mt-2 text-2xl font-bold text-brand-black">120+</div>
                <div className="text-xs text-brand-grey">Vetted listings</div>
              </div>
              <div className="flex-1 min-w-[140px] bg-brand-bg rounded-2xl p-4 border border-neutral-200/60">
                <div className="text-xs text-brand-grey uppercase font-semibold">Clients</div>
                <div className="mt-2 text-2xl font-bold text-brand-black">300+</div>
                <div className="text-xs text-brand-grey">Satisfied homeowners</div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <a
                href="#contact"
                className="inline-flex items-center px-6 py-3 rounded-full bg-brand-gold text-brand-black font-semibold shadow-sm hover:bg-brand-gold/95 transition"
                aria-label="Schedule a consultation"
              >
                Schedule a Consultation
              </a>

              <a
                href="/brochure.pdf"
                className="text-sm text-brand-grey underline underline-offset-4"
                aria-label="Download brochure"
              >
                Download Brochure
              </a>
            </div>
          </div>
        </div>

        {/* Small mission statement */}
        <div className="mt-12 text-center max-w-3xl mx-auto text-sm text-brand-grey">
          <strong className="text-brand-black">Our promise:</strong> transparent guidance,
          curated choices and a singular focus — find a home that fits your future.
        </div>
      </div>
    </section>
  );
};

export default AboutPinnacl;
