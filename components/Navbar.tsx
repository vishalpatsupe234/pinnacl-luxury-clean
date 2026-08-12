"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const tickingRef = useRef(false);

  useEffect(() => {
    function applyScrollState() {
      setScrolled(window.scrollY > 60);
      tickingRef.current = false;
    }

    function onScroll() {
      if (tickingRef.current) return;
      tickingRef.current = true;
      requestAnimationFrame(applyScrollState);
    }

    applyScrollState();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = !isHome || scrolled;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        solid
          ? "bg-white border-b border-brand-black/5"
          : "bg-transparent"
      }`}
    >
      <div className="section-shell">
        <nav className="relative flex items-center gap-4 h-16 md:h-20">
          <Link
            href="/"
            aria-label="Pinnacl Properties home"
            aria-hidden={!solid}
            tabIndex={solid ? undefined : -1}
            className={`select-none absolute inset-y-0 left-0 flex items-center transition-all duration-300 ease-out ${
              solid
                ? "opacity-100 translate-y-0 pointer-events-auto"
                : "opacity-0 -translate-y-2 pointer-events-none"
            }`}
          >
            <Image
              src="/logo/pinnacl-logo-transparent.png"
              alt="Pinnacl Properties"
              width={120}
              height={44}
              priority
              className="h-9 w-auto md:h-14"
            />
          </Link>

          <ul className="ml-auto hidden md:flex items-center gap-8 lg:gap-10 flex-nowrap">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`text-xs uppercase tracking-[0.2em] font-light transition-colors duration-300 ${
                    solid
                      ? "text-brand-black/70 hover:text-brand-black"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <button
            onClick={() => setOpen(!open)}
            className={`ml-auto md:hidden p-2 transition-colors duration-300 ${
              solid ? "text-brand-black" : "text-white"
            }`}
            aria-label="Toggle menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
              />
            </svg>
          </button>
        </nav>
      </div>

      {open && (
        <div
          className={`md:hidden border-t ${
            solid
              ? "bg-white border-brand-black/5"
              : "bg-brand-black/90 border-white/10"
          }`}
        >
          <ul
            className={`px-6 py-6 flex flex-col gap-4 ${
              solid ? "text-brand-black" : "text-white/90"
            }`}
          >
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block py-1 text-xs uppercase tracking-[0.2em] font-light"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
