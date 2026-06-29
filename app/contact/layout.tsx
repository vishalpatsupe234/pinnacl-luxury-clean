import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pinnaclproperties.com";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Connect with Pinnacl Properties for guidance on luxury residential projects across Mumbai and premium locations.",
  alternates: {
    canonical: `${siteUrl}/contact`,
  },
  openGraph: {
    title: "Contact Pinnacl Properties",
    description:
      "Schedule a private consultation with Pinnacl Properties for tailored guidance on premium Mumbai residences.",
    url: `${siteUrl}/contact`,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Contact Pinnacl Properties",
    description:
      "Schedule a private consultation with Pinnacl Properties for tailored guidance on premium Mumbai residences.",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
