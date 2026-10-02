import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pinnaclproperties.com";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Pinnacl Properties about residential property in Maharashtra.",
  alternates: {
    canonical: `${siteUrl}/contact`,
  },
  openGraph: {
    title: "Contact Pinnacl Properties",
    description:
      "Request a private consultation with Pinnacl Properties about residential property in Maharashtra.",
    url: `${siteUrl}/contact`,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Contact Pinnacl Properties",
    description:
      "Request a private consultation with Pinnacl Properties about residential property in Maharashtra.",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
