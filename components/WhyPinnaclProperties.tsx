import React from "react";

const reasons = [
  {
    title: "Handpicked Only",
    desc: "Hum har property ko location, builder reputation, ROI potential, construction quality aur legal clarity ke hisaab se filter karte hain.",
  },
  {
    title: "Zero Noise. Only Value.",
    desc: "Market me 100+ options nahi — sirf woh 3–5 projects milte hain jo aapke lifestyle, budget aur long-term plan ke liye best fit hote hain.",
  },
  {
    title: "Premium Experience",
    desc: "Video walkthroughs, site visits, pricing clarity, negotiation support — sab ek luxury experience ke saath curate kiya jata hai.",
  },
];

const WhyPinnaclProperties: React.FC = () => {
  return (
    <section
      id="why-pinnacl"
      className="bg-brand-bg text-brand-black py-20 border-t border-neutral-200/60"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        
        {/* Top heading */}
        <div className="mb-12 max-w-3xl">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-brand-grey">
            Why Pinnacl Properties
          </p>

          <h2 className="font-serif text-3xl md:text-4xl mt-2 mb-4">
            A Smarter Way to Discover Your Home
          </h2>

          <p className="text-sm md:text-base text-brand-grey">
            Mumbai real estate crowded, confusing aur time-consuming ho sakta hai. 
            Pinnacl Properties simple, clear aur trustworthy guidance provide karta hai — 
            taaki aap sirf best options par focus kar saken.
          </p>
        </div>

        {/* 3 reasons grid */}
        <div className="grid gap-8 md:grid-cols-3">
          {reasons.map((item, idx) => (
            <div
              key={idx}
              className="space-y-4 border border-neutral-200 rounded-3xl p-6 bg-white shadow-sm hover:shadow-lg transition"
            >
              <div className="h-10 w-10 rounded-full bg-brand-gold/15 flex items-center justify-center">
                <span className="text-lg font-bold text-brand-gold">★</span>
              </div>

              <h3 className="font-semibold text-base md:text-lg">
                {item.title}
              </h3>

              <p className="text-sm text-brand-grey leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default WhyPinnaclProperties;