"use client";

import { Diamond, Shield, Minimize2, Eye } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

const values = [
  {
    icon: Diamond,
    title: "Selective",
    description:
      "We present a property only after checking its approvals, the basis of its pricing, and the developer's record. If it does not hold up, we do not present it.",
  },
  {
    icon: Shield,
    title: "Checkable",
    description:
      "Where we hold a project's MahaRERA registration number, we publish it, so you can verify it on the MahaRERA portal yourself.",
  },
  {
    icon: Minimize2,
    title: "Unhurried",
    description:
      "One conversation at a time, at your pace. No pressure, and no scripted follow-ups.",
  },
  {
    icon: Eye,
    title: "Direct",
    description:
      "You deal with the person doing the work. Questions about price or paperwork get a straight answer.",
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
