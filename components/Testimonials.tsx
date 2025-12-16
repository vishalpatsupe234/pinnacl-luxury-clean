import React from "react";
import Image from "next/image";

const testimonials = [
  {
    id: 1,
    quote:
      "Pinnacl ने हमारे लिए घर ढूंढना बेहद आसान कर दिया — उनकी टीम ने हर छोटी detail verify की।",
    name: "Rohit Mehra",
    role: "Investor, Powai",
    avatar: "/testimonials/rohit.jpg",
  },
  {
    id: 2,
    quote:
      "Transparent process और genuine recommendations — बिल्कुल वही मिला जो कहा गया था.",
    name: "Ananya Deshmukh",
    role: "Architect, Bandra",
    avatar: "/testimonials/ananya.jpg",
  },
  {
    id: 3,
    quote:
      "Documentation से ले कर possession तक Pinnacl का support बेहतरीन था. Highly recommended.",
    name: "Sandeep Kulkarni",
    role: "Entrepreneur, BKC",
    avatar: "/testimonials/sandeep.jpg",
  },
];

const Testimonials: React.FC = () => {
  return (
    <section id="testimonials" className="bg-brand-bg py-20 border-t border-neutral-200/60">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-brand-grey">
            Testimonials
          </p>
          <h2 className="font-serif text-3xl md:text-4xl mt-2 text-brand-black">
            What clients say about Pinnacl
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <article
              key={t.id}
              className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-200/70 hover:shadow-md transition"
            >
              <div className="flex items-start gap-4">
                <div className="relative h-14 w-14 rounded-full overflow-hidden">
                  <Image
                    src={t.avatar}
                    alt={t.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="text-sm font-semibold text-brand-black">
                    {t.name}
                  </div>
                  <div className="text-xs text-brand-grey">{t.role}</div>
                </div>
              </div>

              <blockquote className="mt-4 text-sm text-brand-grey leading-relaxed">
                “{t.quote}”
              </blockquote>

              <div className="mt-4 flex items-center gap-2">
                {/* star placeholder */}
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg
                      key={i}
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill={i < 5 ? "currentColor" : "none"} /* all gold */
                      className="text-brand-gold"
                      aria-hidden
                    >
                      <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.402 8.169L12 18.897l-7.336 3.869 1.402-8.169L.132 9.21l8.2-1.192z" />
                    </svg>
                  ))}
                </div>
                <div className="text-xs text-brand-grey">Verified client</div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;