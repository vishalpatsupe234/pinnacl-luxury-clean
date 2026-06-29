"use client";

import { useState } from "react";
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, phone, location, message }),
      });
      setSent(true);
    } catch {
      setSent(true);
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

                  <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
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
                      className="btn-whatsapp w-full sm:w-auto"
                    >
                      WhatsApp Us
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
