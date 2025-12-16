import React from "react";
import Link from "next/link";

const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white text-brand-black border-t border-neutral-200/60">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-brand-gold" />
              <div>
                <div className="text-sm font-semibold tracking-[0.25em] uppercase text-brand-grey">
                  Pinnacl
                </div>
                <div className="text-xs text-neutral-500">Luxury Properties</div>
              </div>
            </div>
            <p className="text-sm text-brand-grey max-w-sm leading-relaxed">
              Handpicked residences for Mumbai’s discerning buyers. Transparent,
              curated and long-term focused.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#home" className="text-brand-grey hover:text-brand-black">
                  Home
                </Link>
              </li>
              <li>
                <Link href="#projects" className="text-brand-grey hover:text-brand-black">
                  Projects
                </Link>
              </li>
              <li>
                <Link href="#about" className="text-brand-grey hover:text-brand-black">
                  About
                </Link>
              </li>
              <li>
                <Link href="#blog" className="text-brand-grey hover:text-brand-black">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Contact</h4>
            <div className="text-sm space-y-2">
              <div className="text-brand-grey">Office: Ambernath, Mumbai</div>
              <div className="text-brand-black font-semibold">+91 9146238303</div>
              <div className="text-sm text-brand-grey">info@pinnaclproperties.com</div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              {/* Social icons simple - replace hrefs */}
              <a aria-label="Instagram" href="#" className="text-brand-gold hover:text-brand-black">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.055 1.97.24 2.428.403.59.213 1.01.47 1.455.915.444.444.702.864.915 1.455.163.458.348 1.258.403 2.428.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.055 1.17-.24 1.97-.403 2.428-.213.59-.47 1.01-.915 1.455-.444.444-.864.702-1.455.915-.458.163-1.258.348-2.428.403-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.055-1.97-.24-2.428-.403-.59-.213-1.01-.47-1.455-.915-.444-.444-.702-.864-.915-1.455-.163-.458-.348-1.258-.403-2.428C2.175 15.747 2.163 15.367 2.163 12s.012-3.584.07-4.85c.055-1.17.24-1.97.403-2.428.213-.59.47-1.01.915-1.455.444-.444.864-.702 1.455-.915.458-.163 1.258-.348 2.428-.403C8.416 2.175 8.796 2.163 12 2.163zm0 1.838c-3.17 0-3.543.012-4.793.069-1.034.047-1.593.218-1.966.363-.498.193-.854.425-1.228.8-.374.374-.607.73-.8 1.228-.145.373-.316.932-.363 1.966-.057 1.25-.069 1.623-.069 4.793s.012 3.543.069 4.793c.047 1.034.218 1.593.363 1.966.193.498.425.854.8 1.228.374.374.73.607 1.228.8.373.145.932.316 1.966.363 1.25.057 1.623.069 4.793.069s3.543-.012 4.793-.069c1.034-.047 1.593-.218 1.966-.363.498-.193.854-.425 1.228-.8.374-.374.607-.73.8-1.228.145-.373.316-.932.363-1.966.057-1.25.069-1.623.069-4.793s-.012-3.543-.069-4.793c-.047-1.034-.218-1.593-.363-1.966-.193-.498-.425-.854-.8-1.228-.374-.374-.73-.607-1.228-.8-.373-.145-.932-.316-1.966-.363-1.25-.057-1.623-.069-4.793-.069zM12 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a3.999 3.999 0 1 1 0-7.998 3.999 3.999 0 0 1 0 7.998zm6.406-11.845a1.44 1.44 0 1 0 0 2.879 1.44 1.44 0 0 0 0-2.879z"/></svg>
              </a>
              <a aria-label="LinkedIn" href="#" className="text-brand-gold hover:text-brand-black">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.854 0-2.137 1.45-2.137 2.948v5.658H9.346V9h3.414v1.561h.049c.476-.9 1.637-1.852 3.37-1.852 3.603 0 4.269 2.372 4.269 5.456v6.287zM5.337 7.433a2.062 2.062 0 110-4.124 2.062 2.062 0 010 4.124zM6.4 20.452H4.273V9H6.4v11.452z"/></svg>
              </a>
            </div>
          </div>

          {/* Legal / small print */}
          <div className="md:col-span-4 mt-6 border-t border-neutral-200/50 pt-6 text-sm text-neutral-500 flex flex-col md:flex-row md:justify-between gap-4">
            <div>© {year} Pinnacl Properties. All rights reserved.</div>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="text-brand-grey hover:text-brand-black">Privacy</Link>
              <Link href="/terms" className="text-brand-grey hover:text-brand-black">Terms</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;