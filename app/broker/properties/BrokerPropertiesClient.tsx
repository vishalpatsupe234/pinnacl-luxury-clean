"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type PropertyRow = {
  id: string;
  title: string;
  slug: string;
  city: string | null;
  locality: string | null;
  property_type: string | null;
  price: number | null;
  price_display: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqft: number | null;
  rera_number: string | null;
  description: string | null;
  project_status: string;
  approval_status: string;
  is_featured: boolean;
  images: string[];
  created_at: string;
};

const STATUS_LABELS: Record<string, string> = {
  under_construction: "Under Construction",
  ready_to_move: "Ready to Move",
  sold_out: "Sold Out",
};

export default function BrokerPropertiesClient({
  initialProperties,
}: {
  initialProperties: PropertyRow[];
}) {
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [status, setStatus] = useState("");

  const cities = useMemo(
    () => Array.from(new Set(initialProperties.map((p) => p.city).filter(Boolean))) as string[],
    [initialProperties]
  );
  const types = useMemo(
    () =>
      Array.from(
        new Set(initialProperties.map((p) => p.property_type).filter(Boolean))
      ) as string[],
    [initialProperties]
  );

  const filtered = useMemo(() => {
    return initialProperties.filter((p) => {
      const matchesSearch =
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.city ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesCity = !city || p.city === city;
      const matchesType = !propertyType || p.property_type === propertyType;
      const matchesStatus = !status || p.project_status === status;
      return matchesSearch && matchesCity && matchesType && matchesStatus;
    });
  }, [initialProperties, search, city, propertyType, status]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-10">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or city"
          className="input-light sm:max-w-xs"
        />
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="input-light sm:max-w-[180px]"
        >
          <option value="">All Cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value)}
          className="input-light sm:max-w-[180px]"
        >
          <option value="">All Types</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="input-light sm:max-w-[200px]"
        >
          <option value="">All Statuses</option>
          <option value="under_construction">Under Construction</option>
          <option value="ready_to_move">Ready to Move</option>
          <option value="sold_out">Sold Out</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm font-light text-brand-muted">No properties found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {filtered.map((p) => (
            <Link key={p.id} href={`/broker/properties/${p.id}`} className="text-left group block">
              <div className="relative aspect-[4/3] overflow-hidden bg-white border border-brand-border">
                {p.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.images[0]}
                    alt={p.title}
                    className="w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-90"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-brand-muted">
                    No Image
                  </div>
                )}
              </div>
              <div className="pt-5">
                {p.is_featured && (
                  <p className="text-[10px] uppercase tracking-[0.25em] text-brand-gold mb-2">
                    Featured
                  </p>
                )}
                <h3 className="font-serif text-lg text-brand-black">{p.title}</h3>
                <p className="mt-1 text-xs font-light text-brand-muted">
                  {[p.city, p.locality].filter(Boolean).join(", ") || "—"}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-brand-black font-light">
                    {p.price_display || (p.price ? `₹${p.price.toLocaleString()}` : "—")}
                  </span>
                  <span className="text-xs uppercase tracking-[0.15em] text-brand-muted">
                    {STATUS_LABELS[p.project_status] || p.project_status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
