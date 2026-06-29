"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PropertyCardLux from "./PropertyCardLux";

type Item = {
  id: string;
  title?: string;
  name?: string;
  slug?: string;
  type?: string;
  price?: number;
  priceDisplay?: string;
  location?: { area?: string; city?: string };
  images?: string[];
  image?: string;
  isFeatured?: boolean;
};

type Props = {
  initialItems?: Item[] | { items?: Item[] } | unknown;
};

export default function PropertiesList({ initialItems = [] }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const normalize = (v: unknown): Item[] => {
    if (!v) return [];
    if (Array.isArray(v)) return v as Item[];
    if (typeof v === "object" && v !== null && "items" in v) {
      const items = (v as { items?: unknown }).items;
      if (Array.isArray(items)) return items as Item[];
    }
    if (typeof v === "object" && v !== null) {
      for (const key of Object.keys(v as Record<string, unknown>)) {
        const candidate = (v as Record<string, unknown>)[key];
        if (Array.isArray(candidate)) {
          return candidate as Item[];
        }
      }
    }
    return [];
  };

  const [items, setItems] = useState<Item[]>(normalize(initialItems));
  const [loading, setLoading] = useState(false);

  const [type, setType] = useState(searchParams.get("type") || "");
  const [loc, setLoc] = useState(searchParams.get("loc") || "");
  const [min, setMin] = useState(searchParams.get("min") || "");
  const [max, setMax] = useState(searchParams.get("max") || "");

  async function fetchItems(params: Record<string, string | number | undefined>) {
    try {
      setLoading(true);

      const base =
        typeof window !== "undefined"
          ? window.location.origin
          : "";

      const url = new URL("/api/properties", base);

      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && String(v).length > 0) {
          url.searchParams.set(k, String(v));
        }
      });

      const res = await fetch(url.toString());
      if (!res.ok) {
        setItems([]);
        return;
      }

      const data = await res.json();
      setItems(normalize(data));
    } catch (err) {
      console.error("fetchItems error:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (loc) params.set("loc", loc);
    if (min) params.set("min", min);
    if (max) params.set("max", max);

    router.push(`/properties?${params.toString()}`);

    fetchItems({
      type,
      loc,
      min: min ? Number(min) : undefined,
      max: max ? Number(max) : undefined,
    });
  }

  useEffect(() => {
    const params = {
      type: searchParams.get("type") || undefined,
      loc: searchParams.get("loc") || undefined,
      min: searchParams.get("min") ? Number(searchParams.get("min")) : undefined,
      max: searchParams.get("max") ? Number(searchParams.get("max")) : undefined,
    };

    if (params.type || params.loc || params.min || params.max) {
      fetchItems(params);
      setType(params.type || "");
      setLoc(params.loc || "");
      setMin(params.min ? String(params.min) : "");
      setMax(params.max ? String(params.max) : "");
    }
  }, [searchParams]);

  return (
    <div className="flex gap-8">
      <aside className="w-full max-w-xs sticky top-24 self-start">
        <div className="card-surface">
          <h3 className="font-semibold mb-3">Filters</h3>

          <label className="text-xs block mb-2">Type</label>
          <div className="flex gap-2 mb-3">
            <button onClick={() => setType("Residential")} className={`px-3 py-1 rounded-full ${type === "Residential" ? "bg-black text-white" : "bg-white text-gray-700 border"}`}>Residential</button>
            <button onClick={() => setType("Commercial")} className={`px-3 py-1 rounded-full ${type === "Commercial" ? "bg-black text-white" : "bg-white text-gray-700 border"}`}>Commercial</button>
            <button onClick={() => setType("")} className="px-3 py-1 rounded-full bg-white text-gray-600 border">Any</button>
          </div>

          <label className="text-xs block mb-2">Location</label>
          <input value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="Powai, BKC..." className="w-full px-3 py-2 rounded border text-sm mb-3" />

          <label className="text-xs block mb-2">Price min</label>
          <input value={min} onChange={(e) => setMin(e.target.value)} className="w-full px-3 py-2 rounded border text-sm mb-3" />

          <label className="text-xs block mb-2">Price max</label>
          <input value={max} onChange={(e) => setMax(e.target.value)} className="w-full px-3 py-2 rounded border text-sm mb-4" />

          <div className="flex gap-2">
            <button onClick={applyFilters} className="btn-primary-hero w-full">Apply</button>
            <button
              onClick={() => {
                setType(""); setLoc(""); setMin(""); setMax("");
                router.push("/properties");
                fetchItems({});
              }}
              className="btn-outline w-full"
            >
              Reset
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1">
        {loading ? (
          <div className="text-center py-20">Loading…</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.length === 0 && (
              <div className="col-span-full text-center py-12 text-neutral-500">
                No properties found.
              </div>
            )}

            {items.map((p) => (
              <PropertyCardLux
                key={p.id ?? p.slug}
                img={p.images?.[0] || p.image || "/properties/placeholder.jpg"}
                tag={p.isFeatured ? "Featured" : undefined}
                title={p.title || p.name || "Property"}
                location={`${p.location?.area || ""}${p.location?.city ? ", " + p.location.city : ""}`}
                price={p.priceDisplay || (p.price ? `₹${p.price.toLocaleString()}` : "")}
                slug={p.slug}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
