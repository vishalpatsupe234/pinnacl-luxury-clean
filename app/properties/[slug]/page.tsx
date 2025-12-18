import PropertyDetails from "@/components/PropertyDetails";
import type { Metadata } from "next";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

/* ---------------- SEO META ---------------- */
export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { slug } = await params;

  const projectName = slug
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    title: `${projectName} | Pinnacl Properties`,
    description: `${projectName} — a RERA-verified luxury residential project with transparent advisory and long-term value.`,
  };
}

/* ---------------- PAGE ---------------- */
export default async function Page({ params }: Props) {
  const { slug } = await params;

  const base =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const res = await fetch(
    `${base}/api/properties?slug=${slug}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch property");
  }

  const data = await res.json();

  return (
    <main className="min-h-screen bg-[var(--color-brand-bg)]">
      <PropertyDetails property={data} />
    </main>
  );
}
