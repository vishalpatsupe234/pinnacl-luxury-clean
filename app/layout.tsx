import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pinnaclproperties.com"),
  title: {
    default: "Pinnacl Properties | Luxury Homes in Mumbai",
    template: "%s | Pinnacl Properties",
  },
  description:
    "Pinnacl Properties curates RERA-verified luxury residential projects across Mumbai, Thane, and premium locations — with clarity, credibility, and discretion.",
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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
