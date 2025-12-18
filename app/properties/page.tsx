// app/properties/page.tsx

import PropertiesList from "@/components/PropertiesList";

/* ---------------------------
   STATIC METADATA (SAFE)
---------------------------- */
export const metadata = {
  title: "Luxury Residential Projects | Pinnacl Properties",
  description:
    "Explore premium residential projects across Mumbai — featuring RERA-verified developers, prime locations, and long-term value.",
};

/* ---------------------------
   PAGE (NO params, NO async)
---------------------------- */
export default function PropertiesPage() {
  return (
    <main className="min-h-screen bg-[var(--color-brand-bg)]">
      <section className="section-shell py-12">
        <h1 className="text-2xl md:text-3xl font-playfair mb-4">
          Properties
        </h1>

        <PropertiesList />
      </section>
    </main>
  );
}
