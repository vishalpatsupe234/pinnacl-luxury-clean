"use client";

import { useState } from "react";
import { TbMessages } from "react-icons/tb";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const WHATSAPP_NUMBER = "919146238303";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Previously this ignored the response entirely and called setSent(true) in
  // both the try and the catch, so a 400, 429 or 500 rendered a thank-you
  // while the enquiry was discarded. Success is now shown only for a 2xx.
  // Entered values are never cleared on failure, so the visitor can retry
  // without retyping.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, phone, location, message }),
      });

      if (!res.ok) {
        setError("Something went wrong. Please try again.");
        return;
      }

      setSent(true);
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
    <main className="min-h-screen bg-brand-bg text-brand-black">
      <Navbar />

      <section className="pt-32 md:pt-40 pb-16 md:pb-24">
        <div className="section-shell">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
            <div>
              <p className="section-label mb-4">Contact</p>
              <h1 className="section-heading mb-6">
                Request a Private Consultation
              </h1>
              <p className="section-body mb-10">
                Every conversation is private, obligation-free, and focused on
                understanding what truly suits you.
              </p>

              <div className="space-y-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-brand-muted mb-2">
                    Office
                  </p>
                  <p className="text-sm font-light">Ambernath, Mumbai</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-brand-muted mb-2">
                    Phone
                  </p>
                  <a
                    href="tel:+919146238303"
                    className="text-sm font-light hover:text-brand-gold transition-colors duration-300"
                  >
                    +91 9146238303
                  </a>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-brand-muted mb-2">
                    Email
                  </p>
                  <a
                    href="mailto:info@pinnaclproperties.com"
                    className="text-sm font-light hover:text-brand-gold transition-colors duration-300"
                  >
                    info@pinnaclproperties.com
                  </a>
                </div>
              </div>
            </div>

            <div>
              {sent ? (
                <div className="py-12 animate-fade-in">
                  <p className="font-serif text-2xl text-brand-black mb-2">
                    Thank you
                  </p>
                  <p className="section-body">
                    We&apos;ll be in touch shortly to schedule your consultation.
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
                    className="input-light"
                  />
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address"
                    className="input-light"
                  />
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone Number"
                    className="input-light"
                  />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Preferred Location"
                    className="input-light"
                  />
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us about your requirements"
                    rows={3}
                    className="input-light resize-none"
                  />

                  {error && (
                    <p className="text-xs font-light text-red-700/80">{error}</p>
                  )}

                  <div className="flex flex-col items-center gap-5 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-gold-outline w-full sm:w-auto"
                    >
                      {loading ? "Sending…" : "Request Consultation"}
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
        </div>
      </section>

      <Footer />
    </main>
  );
}
