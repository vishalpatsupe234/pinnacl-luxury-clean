"use client";

import Link from "next/link";
import Image from "next/image";

type Property = {
  slug: string;
  title: string;
  priceDisplay: string;
  location: { area: string; city: string };
  images: string[];
  areaText: string;
  beds: number;
  type: string;
};

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1605276374104-de6862b9b0b0?auto=format&fit=crop&w=800&q=80",
];

function ProjectCard({
  property,
  index,
}: {
  property: Property;
  index: number;
}) {
  const fallback = FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
  const localImg = property.images[0];
  const useRemote = !localImg || localImg.startsWith("http");

  return (
    <article className="group">
      <Link href={`/properties/${property.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-brand-bg">
          {useRemote ? (
            <Image
              src={fallback}
              alt={property.title}
              fill
              className="object-cover transition-opacity duration-500 group-hover:opacity-90"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={localImg}
              alt={property.title}
              className="w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-90"
              onError={(e) => {
                e.currentTarget.src = fallback;
              }}
            />
          )}
        </div>

        <div className="pt-6 pb-2">
          <p className="text-[10px] uppercase tracking-[0.25em] text-brand-gold mb-2">
            {property.location.area}, {property.location.city}
          </p>
          <h3 className="font-serif text-xl md:text-2xl text-brand-black">
            {property.title}
          </h3>
          <p className="mt-2 text-sm font-light text-brand-muted">
            {property.beds} BHK &middot; {property.areaText}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-brand-black font-light">
              {property.priceDisplay.replace(/â‚¹/g, "₹")}
            </span>
            <span className="text-xs uppercase tracking-[0.15em] text-brand-gold border-b border-brand-gold/30 pb-0.5 transition-colors duration-300 group-hover:border-brand-gold">
              View Project
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default function ProjectsGrid({ items }: { items: Property[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-8">
      {items.map((property, i) => (
        <ProjectCard key={property.slug} property={property} index={i} />
      ))}
    </div>
  );
}
