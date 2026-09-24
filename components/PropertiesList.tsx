"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PropertyCardLux from "./PropertyCardLux";
import { createClient } from "@/lib/supabase/client";
import type { Database, ProjectStatus } from "@/lib/supabase/types";

// Only the columns the public listing selects (here and in
// app/properties/page.tsx). Filter columns are used in the query, not read.
type PropertyRow = Pick<
  Database["public"]["Tables"]["properties"]["Row"],
  | "id"
  | "slug"
  | "title"
  | "images"
  | "is_featured"
  | "locality"
  | "city"
  | "price"
  | "price_display"
>;

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "under_construction", label: "Under Construction" },
  { value: "ready_to_move", label: "Ready to Move" },
  { value: "sold_out", label: "Sold Out" },
];

type Props = {
  // Supabase's own row array on first render (from the Server
  // Component); typed loosely at this boundary only because it
  // crosses a server/client component prop, then treated as
  // PropertyRow[] from here on — see toPropertyRows below.
  initialItems?: unknown;
};

function toPropertyRows(v: unknown): PropertyRow[] {
  return Array.isArray(v) ? (v as PropertyRow[]) : [];
}

export default function PropertiesList({ initialItems = [] }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<PropertyRow[]>(toPropertyRows(initialItems));
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState(searchParams.get("search") || searchParams.get("q") || "");
  const [type, setType] = useState(searchParams.get("type") || "");
  const [loc, setLoc] = useState(searchParams.get("loc") || "");
  const [min, setMin] = useState(searchParams.get("min") || "");
  const [max, setMax] = useState(searchParams.get("max") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");

  // Queries the same Supabase "properties" table the initial
  // server-rendered load uses (app/properties/page.tsx) — no
  // separate API route, no legacy JSON. Visibility is enforced
  // explicitly by the approval_status/deleted_at filters below,
  // matching that initial load exactly, so re-querying here can
  // never widen what the page shows. It is deliberately not left
  // to RLS: policies are OR'd, so an active-broker or super_admin
  // session would otherwise also match pending_review, rejected
  // and soft-deleted rows on this public page.
  const fetchItems = useCallback(async (params: {
    search?: string;
    type?: string;
    loc?: string;
    min?: number;
    max?: number;
    status?: string;
  }) => {
    try {
      setLoading(true);

      const supabase = createClient();
      // Explicit column list, never "*" — this runs in the browser with the
      // public key. Must match app/properties/page.tsx and never include
      // source_broker_id, project_id, inventory_unit_id or migration_state.
      let query = supabase
        .from("properties")
        .select("id, slug, title, images, is_featured, locality, city, price, price_display")
        .eq("approval_status", "approved")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (params.search) {
        const term = params.search.replace(/[%,]/g, "");
        query = query.or(
          `title.ilike.%${term}%,city.ilike.%${term}%,locality.ilike.%${term}%`
        );
      }
      if (params.type) {
        query = query.ilike("property_type", `%${params.type}%`);
      }
      if (params.loc) {
        const term = params.loc.replace(/[%,]/g, "");
        query = query.or(`city.ilike.%${term}%,locality.ilike.%${term}%`);
      }
      if (params.min !== undefined) {
        query = query.gte("price", params.min);
      }
      if (params.max !== undefined) {
        query = query.lte("price", params.max);
      }
      if (params.status) {
        query = query.eq("project_status", params.status as ProjectStatus);
      }

      const { data, error } = await query;
      if (error) {
        console.error("fetchItems error:", error);
        setItems([]);
        return;
      }
      setItems(data ?? []);
    } catch (err) {
      console.error("fetchItems error:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function applyFilters() {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (type) params.set("type", type);
    if (loc.trim()) params.set("loc", loc.trim());
    if (min) params.set("min", min);
    if (max) params.set("max", max);
    if (status) params.set("status", status);

    const query = params.toString();
    router.push(query ? `/properties?${query}` : "/properties", { scroll: false });
  }

  useEffect(() => {
    const searchValue = searchParams.get("search") || searchParams.get("q") || undefined;
    const typeValue = searchParams.get("type") || undefined;
    const locValue = searchParams.get("loc") || undefined;
    const minValue = searchParams.get("min") ? Number(searchParams.get("min")) : undefined;
    const maxValue = searchParams.get("max") ? Number(searchParams.get("max")) : undefined;
    const statusValue = searchParams.get("status") || undefined;

    setSearch(searchValue || "");
    setType(typeValue || "");
    setLoc(locValue || "");
    setMin(minValue ? String(minValue) : "");
    setMax(maxValue ? String(maxValue) : "");
    setStatus(statusValue || "");

    if (searchValue || typeValue || locValue || minValue || maxValue || statusValue) {
      fetchItems({
        search: searchValue,
        type: typeValue,
        loc: locValue,
        min: minValue,
        max: maxValue,
        status: statusValue,
      });
    } else {
      setItems(toPropertyRows(initialItems));
    }
  }, [fetchItems, initialItems, searchParams]);

  return (
    <div className="flex gap-8">
      <aside className="w-full max-w-xs sticky top-24 self-start">
        <div className="card-surface">
          <h3 className="font-semibold mb-3">Filters</h3>

          <label className="text-xs block mb-2">Search</label>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by project, area, or builder" className="w-full px-3 py-2 rounded border text-sm mb-3" />

          <label className="text-xs block mb-2">Type</label>
          <div className="flex gap-2 mb-3">
            <button onClick={() => setType("Residential")} className={`px-3 py-1 rounded-full ${type === "Residential" ? "bg-black text-white" : "bg-white text-gray-700 border"}`}>Residential</button>
            <button onClick={() => setType("Commercial")} className={`px-3 py-1 rounded-full ${type === "Commercial" ? "bg-black text-white" : "bg-white text-gray-700 border"}`}>Commercial</button>
            <button onClick={() => setType("")} className="px-3 py-1 rounded-full bg-white text-gray-600 border">Any</button>
          </div>

          <label className="text-xs block mb-2">Location</label>
          <input value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="Powai, BKC..." className="w-full px-3 py-2 rounded border text-sm mb-3" />

          <label className="text-xs block mb-2">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 rounded border text-sm mb-3">
            <option value="">Any</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <label className="text-xs block mb-2">Price min</label>
          <input value={min} onChange={(e) => setMin(e.target.value)} className="w-full px-3 py-2 rounded border text-sm mb-3" />

          <label className="text-xs block mb-2">Price max</label>
          <input value={max} onChange={(e) => setMax(e.target.value)} className="w-full px-3 py-2 rounded border text-sm mb-4" />

          <div className="flex gap-2">
            <button onClick={applyFilters} className="btn-primary-hero w-full">Apply</button>
            <button
              onClick={() => {
                setSearch("");
                setType("");
                setLoc("");
                setMin("");
                setMax("");
                setStatus("");
                router.push("/properties", { scroll: false });
                setItems(toPropertyRows(initialItems));
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
                key={p.id}
                img={p.images?.[0] || "/properties/placeholder.jpg"}
                tag={p.is_featured ? "Featured" : undefined}
                title={p.title}
                location={[p.locality, p.city].filter(Boolean).join(", ")}
                price={p.price_display || (p.price ? `₹${p.price.toLocaleString()}` : "")}
                slug={p.slug}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
