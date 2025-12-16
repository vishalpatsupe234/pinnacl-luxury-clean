"use client";
// components/Navbar.tsx
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { href: "/", label: "HOME" },
    { href: "/projects", label: "PROJECTS" },
    { href: "/about", label: "ABOUT" },
    { href: "/blog", label: "BLOG" },
    { href: "/contact", label: "CONTACT" },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "backdrop-blur-sm bg-white/80 border-b border-black/5 scrolled-shadow"
          : "backdrop-blur-xl bg-black/30 border-b border-white/10"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6">
        <nav className="flex items-center justify-between h-20 md:h-24">
          {/* Logo (stacked). Text color toggles with scrolled state */}
          <Link href="/" className="flex flex-col leading-none select-none">
            <span
              className={`font-playfair text-xl md:text-2xl tracking-widest font-semibold transition-colors duration-300 ${
                scrolled ? "text-black" : "text-white"
              }`}
            >
              PINNACL
            </span>

            <span
              className={`text-xs md:text-sm tracking-wider mt-1 transition-colors duration-300 ${
                scrolled ? "text-[var(--color-brand-gold)]" : "text-[var(--color-brand-gold)]"
              }`}
              style={{ textShadow: scrolled ? "none" : "0 0 6px rgba(201,166,106,0.18)" }}
            >
              PROPERTIES
            </span>
          </Link>

          {/* Desktop menu (right) */}
          <ul className="hidden md:flex items-center gap-10 text-sm">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`relative py-1 px-0 transition-colors duration-200 nav-link ${
                    scrolled ? "text-black/85 hover:text-black" : "text-white/90 hover:text-white"
                  }`}
                >
                  <span>{item.label}</span>
                  <span
                    className="absolute left-0 right-0 -bottom-2 h-[2px] bg-[var(--color-brand-gold)] transform origin-left transition-transform duration-200 nav-underline"
                    style={{ transform: "scaleX(0)" }}
                  />
                </Link>
              </li>
            ))}
          </ul>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            <button className="hidden md:inline-flex btn-primary-hero transition-transform duration-200">
              Enquire
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setOpen(!open)}
              className={`md:hidden inline-flex items-center justify-center p-2 rounded transition-colors duration-200 ${
                scrolled ? "text-black" : "text-white"
              }`}
              aria-label="Toggle menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </svg>
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className={`md:hidden ${scrolled ? "bg-white/90" : "bg-black/50"} border-t border-white/6`}>
          <div className="px-6 py-4">
            <ul className={`flex flex-col gap-3 text-sm ${scrolled ? "text-black" : "text-white/90"}`}>
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} onClick={() => setOpen(false)} className="block py-2">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/contact" className="block mt-2">
                  <button className="w-full btn-primary-hero">Enquire</button>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}
