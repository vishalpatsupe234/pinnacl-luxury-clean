"use client";

import { useMemo, useState } from "react";
import PropertyForm, { type PropertyFormValues, type Builder } from "./PropertyForm";

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
  builder_id: string | null;
  created_at: string;
};

const STATUS_LABELS: Record<string, string> = {
  under_construction: "Under Construction",
  ready_to_move: "Ready to Move",
  sold_out: "Sold Out",
};

function toFormValues(p: PropertyRow): PropertyFormValues {
  return {
    id: p.id,
    title: p.title,
    city: p.city ?? "",
    locality: p.locality ?? "",
    property_type: p.property_type ?? "",
    price: p.price?.toString() ?? "",
    bedrooms: p.bedrooms?.toString() ?? "",
    bathrooms: p.bathrooms?.toString() ?? "",
    area_sqft: p.area_sqft?.toString() ?? "",
    builder_id: p.builder_id ?? "",
    newBuilderName: "",
    rera_number: p.rera_number ?? "",
    description: p.description ?? "",
    status: p.project_status,
    featured: p.is_featured,
    images: p.images ?? [],
  };
}

export default function PropertiesAdminClient({
  initialProperties,
  builders,
}: {
  initialProperties: PropertyRow[];
  builders: Builder[];
}) {
  const [properties, setProperties] = useState(initialProperties);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PropertyRow | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      const matchesSearch =
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.city ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !statusFilter || p.project_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [properties, search, statusFilter]);

  async function refresh() {
    const res = await fetch("/api/admin/properties");
    const data = await res.json();
    if (res.ok) {
      setProperties(data.properties ?? []);
    }
    setFormOpen(false);
    setEditing(null);
  }

  async function toggleFeatured(p: PropertyRow) {
    const nextFeatured = !p.is_featured;
    setProperties((prev) =>
      prev.map((row) => (row.id === p.id ? { ...row, is_featured: nextFeatured } : row))
    );
    try {
      const res = await fetch(`/api/admin/properties/${p.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ featured: nextFeatured }),
      });
      if (!res.ok) {
        // revert on failure
        setProperties((prev) =>
          prev.map((row) => (row.id === p.id ? { ...row, is_featured: p.is_featured } : row))
        );
      }
    } catch {
      setProperties((prev) =>
        prev.map((row) => (row.id === p.id ? { ...row, is_featured: p.is_featured } : row))
      );
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/properties/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProperties((prev) => prev.filter((p) => p.id !== id));
      }
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  }

  function renderDeleteControl(id: string, labelClassName: string) {
    if (confirmingId === id) {
      return (
        <span className="inline-flex items-center gap-2 text-xs font-light whitespace-nowrap">
          <span className="text-brand-black">Delete this property?</span>
          <button
            onClick={() => handleDelete(id)}
            disabled={deletingId === id}
            className="uppercase tracking-[0.1em] text-red-700 hover:text-red-800"
          >
            {deletingId === id ? "Deleting…" : "Confirm"}
          </button>
          <button
            onClick={() => setConfirmingId(null)}
            className="uppercase tracking-[0.1em] text-brand-muted hover:text-brand-black"
          >
            Cancel
          </button>
        </span>
      );
    }
    return (
      <button
        onClick={() => setConfirmingId(id)}
        className={`${labelClassName} text-brand-muted hover:text-brand-black`}
      >
        Delete
      </button>
    );
  }

  return (
    <div>
      {formOpen ? (
        <PropertyForm
          initialValues={editing ? toFormValues(editing) : undefined}
          builders={builders}
          onCancel={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSaved={refresh}
        />
      ) : (
        <div className="flex flex-col sm:flex-row gap-4 justify-between mb-10">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or city"
              className="input-light sm:max-w-xs"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-light sm:max-w-[200px]"
            >
              <option value="">All Statuses</option>
              <option value="under_construction">Under Construction</option>
              <option value="ready_to_move">Ready to Move</option>
              <option value="sold_out">Sold Out</option>
            </select>
          </div>
          <button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="btn-gold-outline whitespace-nowrap"
          >
            Add Property
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm font-light text-brand-muted">No properties found.</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border text-left">
                  <th className="py-3 pr-4 font-light text-xs uppercase tracking-[0.15em] text-brand-muted">
                    Title
                  </th>
                  <th className="py-3 pr-4 font-light text-xs uppercase tracking-[0.15em] text-brand-muted">
                    City
                  </th>
                  <th className="py-3 pr-4 font-light text-xs uppercase tracking-[0.15em] text-brand-muted">
                    Type
                  </th>
                  <th className="py-3 pr-4 font-light text-xs uppercase tracking-[0.15em] text-brand-muted">
                    Price
                  </th>
                  <th className="py-3 pr-4 font-light text-xs uppercase tracking-[0.15em] text-brand-muted">
                    Status
                  </th>
                  <th className="py-3 pr-4 font-light text-xs uppercase tracking-[0.15em] text-brand-muted">
                    Featured
                  </th>
                  <th className="py-3 pr-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td className="py-4 pr-4 text-brand-black">{p.title}</td>
                    <td className="py-4 pr-4 text-brand-muted font-light">{p.city || "—"}</td>
                    <td className="py-4 pr-4 text-brand-muted font-light">
                      {p.property_type || "—"}
                    </td>
                    <td className="py-4 pr-4 text-brand-muted font-light">
                      {p.price_display || (p.price ? `₹${p.price.toLocaleString()}` : "—")}
                    </td>
                    <td className="py-4 pr-4 text-brand-muted font-light">
                      {STATUS_LABELS[p.project_status] || p.project_status}
                    </td>
                    <td className="py-4 pr-4">
                      <button
                        onClick={() => toggleFeatured(p)}
                        className={`text-xs uppercase tracking-[0.15em] font-light transition-colors ${
                          p.is_featured
                            ? "text-brand-gold hover:text-brand-gold/70"
                            : "text-brand-muted hover:text-brand-black"
                        }`}
                      >
                        {p.is_featured ? "★ Featured" : "☆ Mark Featured"}
                      </button>
                    </td>
                    <td className="py-4 pr-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setEditing(p);
                          setFormOpen(true);
                        }}
                        className="text-xs uppercase tracking-[0.15em] font-light text-brand-gold hover:text-brand-gold/70 transition-colors mr-4"
                      >
                        Edit
                      </button>
                      {renderDeleteControl(
                        p.id,
                        "text-xs uppercase tracking-[0.15em] font-light transition-colors"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-6">
            {filtered.map((p) => (
              <div key={p.id} className="border border-brand-border p-5">
                <p className="text-brand-black mb-1">
                  {p.title}
                  {p.is_featured && (
                    <span className="ml-2 text-[10px] uppercase tracking-[0.15em] text-brand-gold">
                      Featured
                    </span>
                  )}
                </p>
                <p className="text-xs font-light text-brand-muted mb-4">
                  {[p.city, p.property_type].filter(Boolean).join(" · ") || "—"} ·{" "}
                  {STATUS_LABELS[p.project_status] || p.project_status}
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    onClick={() => {
                      setEditing(p);
                      setFormOpen(true);
                    }}
                    className="text-xs uppercase tracking-[0.15em] font-light text-brand-gold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleFeatured(p)}
                    className={`text-xs uppercase tracking-[0.15em] font-light ${
                      p.is_featured ? "text-brand-gold" : "text-brand-muted"
                    }`}
                  >
                    {p.is_featured ? "★ Featured" : "☆ Mark Featured"}
                  </button>
                  {renderDeleteControl(p.id, "text-xs uppercase tracking-[0.15em] font-light")}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
