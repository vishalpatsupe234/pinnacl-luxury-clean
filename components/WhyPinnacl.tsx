"use client";

import { Diamond, Shield, Minimize2, Eye } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

const values = [
  {
    icon: Diamond,
    title: "Luxury",
    description:
      "Every project is handpicked for quality, design, and long-term value — never mass-market listings.",
  },
  {
    icon: Shield,
    title: "Trust",
    description:
      "RERA-registered projects only. Full transparency on documentation, pricing, and developer credentials.",
  },
  {
    icon: Minimize2,
    title: "Simplicity",
    description:
      "A calm, guided experience from first enquiry to possession — no clutter, no pressure.",
  },
  {
    icon: Eye,
    title: "Transparency",
    description:
      "Clear pricing, honest advice, and complete visibility at every step of your journey.",
  },
];

export default function WhyPinnacl() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="bg-white py-24 md:py-32 border-t border-brand-border">
      <div className="section-shell">
        <div className="text-center mb-16 md:mb-20">
          <p className="section-label mb-4">Our Philosophy</p>
          <h2 className="section-heading">Why Pinnacl</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-8">
          {values.map((item, i) => (
            <motion.div
              key={item.title}
              className="text-center px-4"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.6,
                delay: i * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 mb-6">
                <item.icon
                  size={24}
                  strokeWidth={1}
                  className="text-brand-gold"
                />
              </div>
              <h3 className="font-serif text-xl text-brand-black mb-3">
                {item.title}
              </h3>
              <p className="text-sm font-light text-brand-muted leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
