import type { Metadata } from "next";
import { Geist, Playfair_Display } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pinnaclproperties.com"),
  title: {
    default: "Pinnacl Properties | Luxury Homes in Mumbai",
    template: "%s | Pinnacl Properties",
  },
  description:
    "Pinnacl Properties curates RERA-verified luxury residential projects across Mumbai — with clarity, credibility, and discretion.",
  keywords: [
    "Luxury homes Mumbai",
    "Premium properties Mumbai",
    "RERA verified projects",
    "Mumbai real estate consultant",
    "Luxury apartments Mumbai",
  ],
  openGraph: {
    title: "Pinnacl Properties | Luxury Homes in Mumbai",
    description:
      "Handpicked RERA-verified luxury residences curated for lifestyle, legal clarity, and long-term value.",
    url: "https://pinnaclproperties.com",
    siteName: "Pinnacl Properties",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${playfair.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
