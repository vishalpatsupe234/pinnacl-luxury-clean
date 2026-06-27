// app/properties/page.tsx
import PropertiesList from "@/components/PropertiesList"; // optional client component that shows the cards
import React from "react";

type Props = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default function PropertiesPage({ searchParams }: Props) {
  // searchParams comes from Next.js app router
  const type = typeof searchParams?.type === "string" ? searchParams?.type : "";
  const loc = typeof searchParams?.loc === "string" ? searchParams?.loc : "";

  // For SSR we can fetch server-side here if needed.
  // For now, pass to client component or render simple text:
  return (
    <main className="min-h-screen bg-[var(--color-brand-bg)]">
      <section className="section-shell py-12">
        <h1 className="text-3xl font-playfair mb-4">Properties</h1>
        <p className="text-sm text-neutral-500 mb-6">
          Filter: <strong>{type || "All"}</strong> • Location: <strong>{loc || "All"}</strong>
        </p>

        {/* Option A: render a client component that fetches and shows results */}
        <PropertiesList initialFilters={{ type, loc }} />

        {/* Option B: simple fallback */}
        {/* <div>Show results here (type={type} loc={loc})</div> */}
      </section>
    </main>
  );
}
