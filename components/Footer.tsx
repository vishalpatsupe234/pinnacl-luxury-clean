import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand-black text-white">
      <div className="section-shell py-16 md:py-20">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-12">
          <div>
            <Link href="/" className="inline-block">
              <span className="font-serif text-2xl tracking-[0.12em] text-brand-gold">
                Pinnacl
              </span>
              <span className="block text-[10px] tracking-[0.35em] uppercase text-white/40 mt-1">
                Properties
              </span>
            </Link>
            <p className="mt-6 text-sm font-light text-white/50 max-w-xs leading-relaxed">
              Luxury property advisory for discerning buyers across Mumbai and Maharashtra.
            </p>
          </div>

          <div className="flex gap-16 md:gap-24">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/30 mb-4">
                Navigate
              </p>
              <ul className="space-y-3">
                {[
                  { href: "/", label: "Residences" },
                  { href: "/projects", label: "Collections" },
                  { href: "/about", label: "Our Story" },
                  { href: "/contact", label: "Enquire" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm font-light text-white/60 hover:text-brand-gold transition-colors duration-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/30 mb-4">
                Contact
              </p>
              <ul className="space-y-3 text-sm font-light text-white/60">
                <li>Ambernath, Mumbai</li>
                <li>
                  <a
                    href="tel:+919146238303"
                    className="hover:text-brand-gold transition-colors duration-300"
                  >
                    +91 9146238303
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:info@pinnaclproperties.com"
                    className="hover:text-brand-gold transition-colors duration-300"
                  >
                    info@pinnaclproperties.com
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-xs font-light text-white/30">
            &copy; {year} Pinnacl Properties. All rights reserved.
          </p>
          <p className="text-xs font-light text-white/30">
            RERA Registered &middot; Verified Projects Only
          </p>
        </div>
      </div>
    </footer>
  );
}
