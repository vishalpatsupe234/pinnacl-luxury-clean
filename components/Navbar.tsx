"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 32);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { href: "#residences", label: "Residences" },
    { href: "#collection", label: "Collection" },
    { href: "#about", label: "Philosophy" },
    { href: "#contact", label: "Contact" },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="container-lux">
        <nav className="flex items-center justify-between h-20 md:h-24">
          {/* Logo */}
          <Link href="/" className="flex flex-col leading-none select-none">
            <span className="font-serif text-xl md:text-2xl tracking-[0.18em] font-semibold text-foreground">
              PINNACL
            </span>
            <span className="text-[10px] md:text-xs tracking-[0.4em] mt-1 text-gold">
              ESTATE
            </span>
          </Link>

          {/* Desktop menu */}
          <ul className="hidden md:flex items-center gap-10 text-sm">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="group relative tracking-wide text-foreground/70 transition-colors duration-200 hover:text-foreground"
                >
                  {item.label}
                  <span className="absolute left-0 -bottom-1.5 h-px w-0 bg-gold transition-all duration-300 group-hover:w-full" />
                </Link>
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link href="#contact" className="hidden md:inline-flex btn-gold">
              Private Enquiry
            </Link>

            <button
              onClick={() => setOpen(!open)}
              className="md:hidden inline-flex items-center justify-center p-2 text-foreground"
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d={open ? "M6 18L18 6M6 6l12 12" : "M4 7h16M4 12h16M4 17h16"}
                />
              </svg>
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-t border-border">
          <div className="container-lux py-6">
            <ul className="flex flex-col gap-1 text-sm">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block py-3 tracking-wide text-foreground/80 hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li className="pt-3">
                <Link href="#contact" onClick={() => setOpen(false)} className="btn-gold w-full">
                  Private Enquiry
                </Link>
              </li>
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}
