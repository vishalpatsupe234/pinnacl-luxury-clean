import PropertiesList from "@/components/PropertiesList";

export default async function PropertiesPage() {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const res = await fetch(`${base}/api/properties`, {
    cache: "no-store",
  });

  const data = await res.json();
  const items = Array.isArray(data) ? data : data?.items ?? [];

  return (
    <main className="min-h-screen bg-[var(--color-brand-bg)]">
      <section className="section-shell py-12">
        <h1 className="text-2xl md:text-3xl font-playfair mb-4">
          Properties
        </h1>

        <PropertiesList initialItems={items} />
      </section>
    </main>
  );
}
