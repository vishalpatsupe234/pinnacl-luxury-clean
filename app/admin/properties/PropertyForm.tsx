"use client";

import { useState } from "react";
import { uploadPropertyImages } from "@/lib/supabase/propertyImages";

export type Builder = { id: string; name: string };

export type PropertyFormValues = {
  id?: string;
  title: string;
  city: string;
  locality: string;
  property_type: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  area_sqft: string;
  builder_id: string;
  newBuilderName: string;
  rera_number: string;
  description: string;
  status: string;
  featured: boolean;
  images: string[];
};

const EMPTY: PropertyFormValues = {
  title: "",
  city: "",
  locality: "",
  property_type: "",
  price: "",
  bedrooms: "",
  bathrooms: "",
  area_sqft: "",
  builder_id: "",
  newBuilderName: "",
  rera_number: "",
  description: "",
  status: "under_construction",
  featured: false,
  images: [],
};

const NEW_BUILDER_VALUE = "__new__";

type Props = {
  initialValues?: PropertyFormValues;
  builders: Builder[];
  onCancel: () => void;
  onSaved: () => void;
};

export default function PropertyForm({ initialValues, builders, onCancel, onSaved }: Props) {
  const [values, setValues] = useState<PropertyFormValues>(initialValues ?? EMPTY);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEdit = Boolean(values.id);
  const addingNewBuilder = values.builder_id === NEW_BUILDER_VALUE;

  function update<K extends keyof PropertyFormValues>(key: K, value: PropertyFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function uploadFiles(files: File[]) {
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) return;

    setUploading(true);
    setError("");
    try {
      const urls = await uploadPropertyImages(imageFiles);
      update("images", [...values.images, ...urls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    await uploadFiles(files);
    e.target.value = "";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    await uploadFiles(files);
  }

  function removeImage(url: string) {
    update(
      "images",
      values.images.filter((img) => img !== url)
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload: Record<string, unknown> = {
      title: values.title,
      city: values.city,
      locality: values.locality,
      property_type: values.property_type,
      price: values.price,
      bedrooms: values.bedrooms,
      bathrooms: values.bathrooms,
      area_sqft: values.area_sqft,
      rera_number: values.rera_number,
      description: values.description,
      status: values.status,
      featured: values.featured,
      images: values.images,
    };

    if (addingNewBuilder) {
      payload.builder = values.newBuilderName;
    } else if (values.builder_id) {
      payload.builder_id = values.builder_id;
    }

    try {
      const res = await fetch(
        isEdit ? `/api/admin/properties/${values.id}` : "/api/admin/properties",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();

      if (!res.ok || (!data.ok && data.error)) {
        setError(data.error || "Could not save property");
        setSaving(false);
        return;
      }

      onSaved();
    } catch {
      setError("Could not save property");
      setSaving(false);
    }
  }

  return (
    <div className="border border-brand-border bg-white p-6 md:p-10 mb-16">
      <p className="section-label mb-8">{isEdit ? "Edit Property" : "Add Property"}</p>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <input
            required
            value={values.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Title"
            className="input-light"
          />

          <div>
            <select
              value={values.builder_id}
              onChange={(e) => update("builder_id", e.target.value)}
              className="input-light"
            >
              <option value="">Select Builder</option>
              {builders.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
              <option value={NEW_BUILDER_VALUE}>+ Add New Builder</option>
            </select>
            {addingNewBuilder && (
              <input
                value={values.newBuilderName}
                onChange={(e) => update("newBuilderName", e.target.value)}
                placeholder="New Builder Name"
                className="input-light mt-4"
              />
            )}
          </div>

          <input
            value={values.city}
            onChange={(e) => update("city", e.target.value)}
            placeholder="City"
            className="input-light"
          />
          <input
            value={values.locality}
            onChange={(e) => update("locality", e.target.value)}
            placeholder="Locality"
            className="input-light"
          />
          <input
            value={values.property_type}
            onChange={(e) => update("property_type", e.target.value)}
            placeholder="Property Type (Apartment, Villa, Plot…)"
            className="input-light"
          />
          <select
            value={values.status}
            onChange={(e) => update("status", e.target.value)}
            className="input-light"
          >
            <option value="under_construction">Under Construction</option>
            <option value="ready_to_move">Ready to Move</option>
            <option value="sold_out">Sold Out</option>
          </select>
          <input
            type="number"
            value={values.price}
            onChange={(e) => update("price", e.target.value)}
            placeholder="Price"
            className="input-light"
          />
          <input
            value={values.rera_number}
            onChange={(e) => update("rera_number", e.target.value)}
            placeholder="RERA Number"
            className="input-light"
          />
          <input
            type="number"
            value={values.bedrooms}
            onChange={(e) => update("bedrooms", e.target.value)}
            placeholder="Bedrooms"
            className="input-light"
          />
          <input
            type="number"
            value={values.bathrooms}
            onChange={(e) => update("bathrooms", e.target.value)}
            placeholder="Bathrooms"
            className="input-light"
          />
          <input
            type="number"
            value={values.area_sqft}
            onChange={(e) => update("area_sqft", e.target.value)}
            placeholder="Area (sq.ft)"
            className="input-light"
          />
          <label className="flex items-center gap-3 text-sm font-light text-brand-black">
            <input
              type="checkbox"
              checked={values.featured}
              onChange={(e) => update("featured", e.target.checked)}
              className="accent-brand-gold"
            />
            Featured Property
          </label>
        </div>

        <textarea
          value={values.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Description"
          rows={4}
          className="input-light resize-none"
        />

        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-brand-muted mb-4">
            Image Gallery
          </p>

          <label
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center gap-2 border border-dashed px-6 py-10 text-center cursor-pointer transition-colors duration-300 ${
              dragActive ? "border-brand-gold bg-brand-gold/5" : "border-brand-border"
            }`}
          >
            <p className="text-sm font-light text-brand-black">
              Drag & drop images here, or click to browse
            </p>
            <p className="text-xs font-light text-brand-muted">JPG, PNG — multiple files allowed</p>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              disabled={uploading}
              className="hidden"
            />
          </label>
          {uploading && <p className="text-xs text-brand-muted mt-3">Uploading…</p>}

          {values.images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-6">
              {values.images.map((url, i) => (
                <div key={url} className="relative aspect-square border border-brand-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 bg-brand-black/80 text-white text-[9px] uppercase tracking-[0.1em] px-1.5 py-0.5">
                      Cover
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(url)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-brand-black text-white text-xs flex items-center justify-center"
                    aria-label="Remove image"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-xs text-red-700/80 font-light">{error}</p>}

        <div className="flex gap-4">
          <button type="submit" disabled={saving || uploading} className="btn-gold-outline">
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Property"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-xs uppercase tracking-[0.15em] font-light text-brand-muted hover:text-brand-black transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
