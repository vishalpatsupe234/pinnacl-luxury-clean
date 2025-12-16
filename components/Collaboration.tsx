// components/Collaboration.tsx
"use client";

import React, { useState } from "react";

const Collaboration: React.FC = () => {
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);

    // Placeholder behaviour: replace with real API call later
    setTimeout(() => {
      setSending(false);
      setDone(true);
    }, 900);
  };

  return (
<section
  id="contact"
  className="bg-brand-bg py-20 border-t border-neutral-200/60"
>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 items-center">
          {/* Left: Message + benefits */}
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-brand-grey">
              Collaboration
            </p>

            <h2 className="font-serif text-3xl md:text-4xl mt-4 text-brand-black">
              Partner with Pinnacl
            </h2>

            <p className="mt-4 text-sm text-brand-grey max-w-xl">
              We partner with select builders, investors and advisors to create curated residential
              experiences. If you value quality, clarity and long-term relationships — let’s explore
              synergies.
            </p>

            <ul className="mt-6 space-y-3 max-w-md">
              <li className="flex gap-3 items-start">
                <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-gold/10 text-brand-gold text-sm font-semibold">✓</span>
                <span className="text-sm text-brand-black">Curated, vetted project pipeline</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-gold/10 text-brand-gold text-sm font-semibold">✓</span>
                <span className="text-sm text-brand-black">Dedicated partnership manager</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-gold/10 text-brand-gold text-sm font-semibold">✓</span>
                <span className="text-sm text-brand-black">Transparent commercial terms</span>
              </li>
            </ul>

            <div className="mt-6 flex gap-3">
              <a
                href="#contact"
                className="inline-flex items-center gap-2 rounded-full border border-brand-gold px-5 py-3 text-sm font-semibold text-brand-gold hover:bg-brand-gold hover:text-brand-black transition"
                aria-label="Start collaboration"
              >
                Start Collaboration
              </a>

              <a
                href="/pinnacl-partner-brochure.pdf"
                className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-brand-black bg-white/80 hover:bg-white transition"
                aria-label="Download partner brochure"
              >
                Download Brochure
              </a>
            </div>
          </div>

          {/* Right: Simple contact card (Client Component) */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
            <h3 className="font-semibold text-lg text-brand-black mb-2">Let's Talk</h3>
            <p className="text-sm text-brand-grey mb-4">
              Share a brief about your project or partnership idea and our team will get back within 48 hours.
            </p>

            {!done ? (
              <form className="space-y-3" onSubmit={handleSubmit}>
                <label className="sr-only" htmlFor="collab-name">Name</label>
                <input
                  id="collab-name"
                  name="name"
                  required
                  placeholder="Your name"
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                />

                <label className="sr-only" htmlFor="collab-email">Email</label>
                <input
                  id="collab-email"
                  name="email"
                  type="email"
                  required
                  placeholder="Email"
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                />

                <label className="sr-only" htmlFor="collab-msg">Message</label>
                <textarea
                  id="collab-msg"
                  name="message"
                  rows={4}
                  placeholder="Project / collaboration idea (1-2 lines)"
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                />

                <div className="flex items-center justify-between mt-2">
                  <button
                    type="submit"
                    disabled={sending}
                    className="rounded-full bg-brand-gold px-5 py-2 text-sm font-semibold text-brand-black hover:bg-brand-gold/90 transition disabled:opacity-60"
                  >
                    {sending ? "Sending…" : "Send Inquiry"}
                  </button>

                  <div className="text-xs text-brand-grey">Or email us: <a href="mailto:partners@pinnacl.com" className="text-brand-black underline">partners@pinnacl.com</a></div>
                </div>
              </form>
            ) : (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
                Thank you — we received your inquiry. We will contact you shortly.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Collaboration;