"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

const navItems = [
  { href: "/", label: "Residences" },
  { href: "/projects", label: "Collections" },
  { href: "/about", label: "Our Story" },
  { href: "/contact", label: "Enquire" },
];

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState(false);
  const tickingRef = useRef(false);
  const prefersReducedMotion = useReducedMotion();

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

  const onNonHomePage = !isHome;
  const light = isHome; // Light background for mobile on home page
  const solid = !isHome || scrolled; // Nav links visible when scrolled or on non-home page

  // STATE 1: Top of hero (fully transparent)
  // STATE 2: Scrolled, no hover (dark glass)
  // STATE 3: Scrolled with hover (white frosted)
  // STATE 4: Non-home page (white frosted)
  const shouldShowWhiteGlass = (scrolled && hovered) || onNonHomePage;
  const shouldShowDarkGlass = scrolled && !hovered && isHome;

  const glassTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.3 };

  return (
    <motion.header
      initial={false}
      animate={{
        backgroundColor: shouldShowWhiteGlass
          ? "rgba(248,247,243,0.94)"
          : shouldShowDarkGlass
            ? "rgba(17,17,17,0.34)"
            : "rgba(255,255,255,0)",
        backdropFilter: shouldShowWhiteGlass
          ? "blur(22px)"
          : shouldShowDarkGlass
            ? "blur(10px)"
            : "blur(0px)",
        borderColor: shouldShowWhiteGlass
          ? "rgba(17,17,17,0.06)"
          : "rgba(255,255,255,0)",
      }}
      style={{
        WebkitBackdropFilter: shouldShowWhiteGlass
          ? "blur(22px)"
          : shouldShowDarkGlass
            ? "blur(10px)"
            : "blur(0px)",
      }}
      transition={glassTransition}
      onMouseEnter={() => scrolled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="fixed inset-x-0 top-0 z-50 border-b"
    >
      <div className="section-shell">
        <nav className="flex items-center gap-4 h-16 md:h-20">
          <ul
            aria-hidden={!solid}
            className={`ml-auto hidden md:flex items-center gap-8 lg:gap-10 flex-nowrap transition-all duration-300 ease-out ${
              solid
                ? "opacity-100 translate-y-0 pointer-events-auto"
                : "opacity-0 -translate-y-2 pointer-events-none"
            }`}
          >
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  tabIndex={solid ? undefined : -1}
                  className={`relative inline-block text-xs uppercase tracking-[0.2em] font-light transition-colors duration-300 [text-shadow:0_1px_4px_rgba(0,0,0,0.3)] after:content-[''] after:absolute after:left-1/2 after:-bottom-1 after:h-px after:w-0 after:-translate-x-1/2 after:bg-brand-gold after:transition-[width] after:duration-[240ms] after:ease-out hover:after:w-full ${
                    shouldShowWhiteGlass
                      ? "text-brand-black"
                      : "text-white/90 hover:text-white/95"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <button
            onClick={() => setOpen(!open)}
            className={`ml-auto md:hidden p-2 transition-colors duration-300 [text-shadow:0_1px_4px_rgba(0,0,0,0.3)] ${
              shouldShowWhiteGlass ? "text-brand-black" : "text-white"
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
          className={`md:hidden border-t transition-colors duration-300 ${
            light
              ? "bg-brand-black/90 border-white/10"
              : "bg-white/95 backdrop-blur-md border-brand-black/5"
          }`}
        >
          <ul
            className={`px-6 py-6 flex flex-col gap-4 ${
              light ? "text-white/90" : "text-brand-black"
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
    </motion.header>
  );
}
