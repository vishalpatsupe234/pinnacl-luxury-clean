import PropertiesClient from "@/components/PropertiesClient";

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const res = await fetch(`${base}/api/properties`, {
    cache: "no-store",
  });

  const data = await res.json();
  const items = Array.isArray(data) ? data : data?.items ?? [];

  return (
    <section className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Properties</h1>
      <PropertiesClient initialItems={items} />
    </section>
  );
}
