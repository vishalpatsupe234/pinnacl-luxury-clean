import PropertyDetails from "@/components/PropertyDetails";

export default async function PropertySlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const base =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const res = await fetch(
    `${base}/api/properties?slug=${slug}`,
    { cache: "no-store" }
  );

  const data = await res.json();

  return (
    <main className="min-h-screen bg-[var(--color-brand-bg)]">
      <PropertyDetails property={data} />
    </main>
  );
}
