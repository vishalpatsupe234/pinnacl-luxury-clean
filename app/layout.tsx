import type { Metadata } from "next";
import { Geist, Playfair_Display } from "next/font/google";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pinnaclproperties.com";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Pinnacl Properties",
  url: siteUrl,
  logo: `${siteUrl}/favicon.ico`,
  description:
    "Pinnacl Properties is a luxury real estate advisory specializing in RERA-verified residences across Mumbai.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Ambernath",
    addressRegion: "Maharashtra",
    addressCountry: "IN",
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Pinnacl Properties",
  url: siteUrl,
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/properties?search={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Pinnacl Properties | Luxury Homes in Maharashtra",
    template: "%s | Pinnacl Properties",
  },
  description:
    "Pinnacl Properties curates RERA-verified luxury residential projects across Maharashtra — with clarity, credibility, and discretion.",
  keywords: [
    "Luxury homes Maharashtra",
    "Premium properties Maharashtra",
    "RERA verified projects",
    "Maharashtra real estate consultant",
    "Luxury apartments Maharashtra",
    "Luxury residences Maharashtra",
  ],
  alternates: {
    canonical: siteUrl,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Pinnacl Properties | Luxury Homes in Maharashtra",
    description:
      "Handpicked RERA-verified luxury residences curated for lifestyle, legal clarity, and long-term value.",
    url: siteUrl,
    siteName: "Pinnacl Properties",
    type: "website",
    images: [
      {
        url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
        width: 1200,
        height: 630,
        alt: "Luxury residence in Maharashtra",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pinnacl Properties | Luxury Homes in Maharashtra",
    description:
      "Handpicked RERA-verified luxury residences curated for lifestyle, legal clarity, and long-term value.",
    images: [
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${playfair.variable}`}>
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
        {children}
      </body>
    </html>
  );
}
