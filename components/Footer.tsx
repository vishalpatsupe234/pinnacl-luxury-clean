import React from "react";
import Link from "next/link";

const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer id="contact" className="border-t border-border bg-surface">
      <div className="container-lux py-20">
        {/* CTA strip */}
        <div className="flex flex-col items-start justify-between gap-8 border-b border-border pb-16 md:flex-row md:items-end">
          <div className="max-w-xl">
            <span className="eyebrow mb-4 block">Private Enquiry</span>
            <h2 className="text-balance text-3xl leading-tight text-foreground md:text-4xl">
              Begin a quiet conversation about your next address
            </h2>
          </div>
          <Link href="mailto:private@pinnaclestate.com" className="btn-gold">
            Request Introduction
          </Link>
        </div>

        {/* Columns */}
        <div className="grid grid-cols-1 gap-10 pt-16 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex flex-col leading-none">
              <span className="font-serif text-2xl tracking-[0.18em] font-semibold text-foreground">
                PINNACL
              </span>
              <span className="text-xs tracking-[0.4em] mt-1 text-gold">ESTATE</span>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-muted">
              A private advisory placing exceptional residences with discerning
              owners across Mumbai&apos;s most coveted addresses.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-xs uppercase tracking-[0.25em] text-muted">Explore</h4>
            <ul className="space-y-3 text-sm">
              {["Residences", "Collection", "Philosophy", "Journal"].map((l) => (
                <li key={l}>
                  <Link href="#collection" className="text-foreground/70 transition-colors hover:text-gold">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs uppercase tracking-[0.25em] text-muted">Contact</h4>
            <ul className="space-y-3 text-sm text-foreground/70">
              <li>Mumbai · By appointment</li>
              <li className="text-foreground">+91 91462 38303</li>
              <li>private@pinnaclestate.com</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs uppercase tracking-[0.25em] text-muted">Follow</h4>
            <ul className="space-y-3 text-sm">
              {["Instagram", "LinkedIn"].map((l) => (
                <li key={l}>
                  <a href="#" className="text-foreground/70 transition-colors hover:text-gold">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-border pt-8 text-xs text-muted md:flex-row md:justify-between">
          <div>© {year} Pinnacl Estate. All rights reserved.</div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
