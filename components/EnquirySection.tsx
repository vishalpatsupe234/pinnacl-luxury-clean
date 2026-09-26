"use client";

import { useState } from "react";
import { TbMessages } from "react-icons/tb";

const WHATSAPP_NUMBER = "919146238303";

export default function EnquirySection() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Previously the response was discarded and setSent(true) ran in both the
  // try and the catch, so a 400, 429 or 500 rendered a thank-you while the
  // enquiry was discarded. Success is now shown only for a 2xx, and the
  // fields are cleared only on success so a failed submission can be retried
  // without retyping.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, phone, message }),
      });

      if (!res.ok) {
        setError("Something went wrong. Please try again.");
        return;
      }

      setSent(true);
      setName("");
      setPhone("");
      setMessage("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "Hello, I would like to enquire about luxury properties with Pinnacl Properties."
  )}`;

  return (
    <section id="enquiry" className="bg-brand-black py-24 md:py-32">
      <div className="section-shell">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <p className="section-label mb-4">Get in Touch</p>
            <h2 className="font-serif text-3xl md:text-4xl text-white">
              Begin Your Journey
            </h2>
            <p className="mt-4 text-sm font-light text-white/50 leading-relaxed">
              Every conversation is private, obligation-free, and focused on
              what truly suits you.
            </p>
          </div>

          {sent ? (
            <div className="text-center py-8 animate-fade-in">
              <p className="text-white/80 font-light">
                Thank you. We&apos;ll be in touch shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                className="input-minimal"
              />
              <input
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone Number"
                className="input-minimal"
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what you're looking for"
                rows={3}
                className="input-minimal resize-none"
              />

              {error && (
                <p className="text-xs font-light text-white/70">{error}</p>
              )}

              <div className="flex flex-col items-center gap-5 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gold-outline w-full sm:w-auto"
                >
                  {loading ? "Sending…" : "Send Enquiry"}
                </button>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative inline-flex items-center gap-1.5 text-xs font-light uppercase tracking-[0.15em] text-brand-gold/70 transition-colors duration-300 after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:bg-brand-gold/40 after:transition-colors after:duration-300 hover:text-brand-gold hover:after:bg-brand-gold"
                >
                  <TbMessages size={16} strokeWidth={1.5} />
                  Enquire
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
