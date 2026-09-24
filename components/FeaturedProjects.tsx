"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { resolvePropertyImageUrl } from "@/lib/supabase/propertyImageUrl";
import type { Database } from "@/lib/supabase/types";

// Only the columns app/page.tsx selects for this public section.
type PropertyRow = Pick<
  Database["public"]["Tables"]["properties"]["Row"],
  | "id"
  | "slug"
  | "title"
  | "description"
  | "images"
  | "price"
  | "price_display"
  | "locality"
  | "city"
  | "area_text"
  | "area_sqft"
>;

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80",
];

function priceText(property: PropertyRow): string {
  return property.price_display || (property.price ? `₹${property.price.toLocaleString()}` : "");
}

function locationText(property: PropertyRow): string {
  return [property.locality, property.city].filter(Boolean).join(", ");
}

function PropertyCard({
  property,
  fallbackImage,
}: {
  property: PropertyRow;
  fallbackImage: string;
}) {
  const rawImage = property.images?.[0];

  return (
    <article className="group">
      <Link href={`/properties/${property.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-brand-bg">
          <Image
            src={rawImage ? resolvePropertyImageUrl(rawImage) : fallbackImage}
            alt={property.title}
            fill
            className="object-cover transition-opacity duration-500 group-hover:opacity-90"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>

        <div className="pt-6 pb-2">
          <p className="text-[10px] uppercase tracking-[0.25em] text-brand-gold mb-2">
            {locationText(property)}
          </p>
          <h3 className="font-serif text-xl md:text-2xl text-brand-black">
            {property.title}
          </h3>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm font-light text-brand-muted">
              {property.area_text || (property.area_sqft ? `${property.area_sqft} sq.ft` : "")}
            </span>
            <span className="text-sm text-brand-black font-light">{priceText(property)}</span>
          </div>
          <span className="inline-block mt-4 text-xs uppercase tracking-[0.15em] text-brand-gold border-b border-brand-gold/30 pb-0.5 transition-colors duration-300 group-hover:border-brand-gold">
            View Property
          </span>
        </div>
      </Link>
    </article>
  );
}

// A single featured property deserves a deliberate showcase, not one
// card stranded in an otherwise-empty 3-column grid.
function SingleFeaturedProperty({ property }: { property: PropertyRow }) {
  const rawImage = property.images?.[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
      <Link
        href={`/properties/${property.slug}`}
        className="block relative aspect-[4/3] overflow-hidden bg-brand-bg group"
      >
        <Image
          src={rawImage ? resolvePropertyImageUrl(rawImage) : FALLBACK_IMAGES[0]}
          alt={property.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </Link>

      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-brand-gold mb-3">
          {locationText(property)}
        </p>
        <h3 className="font-serif text-2xl md:text-3xl text-brand-black mb-4">
          {property.title}
        </h3>
        {property.description && (
          <p className="text-sm font-light text-brand-muted leading-relaxed mb-6 max-w-md">
            {property.description}
          </p>
        )}
        <div className="flex items-center gap-6 mb-8">
          <span className="text-lg font-light text-brand-black">{priceText(property)}</span>
          {(property.area_text || property.area_sqft) && (
            <span className="text-sm font-light text-brand-muted">
              {property.area_text || `${property.area_sqft} sq.ft`}
            </span>
          )}
        </div>
        <Link href={`/properties/${property.slug}`} className="btn-gold-outline">
          View Property
        </Link>
      </div>
    </div>
  );
}

// No featured inventory yet — an advisory CTA, not an empty grid.
function NoFeaturedPropertiesYet() {
  return (
    <div className="max-w-lg mx-auto text-center">
      <p className="text-sm font-light text-brand-muted leading-relaxed mb-8">
        New listings are added personally, one at a time. Begin a private
        consultation to hear about upcoming opportunities before they&apos;re
        listed.
      </p>
      <Link href="/contact" className="btn-gold-outline">
        Begin a Private Consultation
      </Link>
    </div>
  );
}

export default function FeaturedProjects({ properties }: { properties: PropertyRow[] }) {
  const featured = properties.slice(0, 3);
  const hasMore = properties.length > 3;
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="bg-white py-24 md:py-32">
      <div className="section-shell">
        <div className="text-center mb-16 md:mb-20">
          <p className="section-label mb-4">Curated Selection</p>
          <h2 className="section-heading">Featured Properties</h2>
          <p className="section-body mt-4 max-w-lg mx-auto">
            Handpicked residences across Mumbai&apos;s most sought-after addresses.
          </p>
        </div>

        {featured.length === 0 && <NoFeaturedPropertiesYet />}

        {featured.length === 1 && <SingleFeaturedProperty property={featured[0]} />}

        {featured.length >= 2 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-8">
            {featured.map((property, i) => (
              <motion.div
                key={property.id}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <PropertyCard property={property} fallbackImage={FALLBACK_IMAGES[i % FALLBACK_IMAGES.length]} />
              </motion.div>
            ))}
          </div>
        )}

        {(hasMore || featured.length > 0) && (
          <div className="text-center mt-16">
            <Link href="/properties" className="btn-gold-outline">
              View All Properties
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
