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
};

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80",
];

function PropertyCard({
  property,
  fallbackImage,
}: {
  property: Property;
  fallbackImage: string;
}) {
  const localImg = property.images[0];
  const useRemote = !localImg || localImg.startsWith("http");

  return (
    <article className="group">
      <Link href={`/properties/${property.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-brand-bg">
          {useRemote ? (
            <Image
              src={fallbackImage}
              alt={property.title}
              fill
              className="object-cover transition-opacity duration-500 group-hover:opacity-90"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={localImg}
              alt={property.title}
              className="w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-90"
              onError={(e) => {
                e.currentTarget.src = fallbackImage;
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
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm font-light text-brand-muted">
              {property.areaText}
            </span>
            <span className="text-sm text-brand-black font-light">
              {property.priceDisplay.replace(/â‚¹/g, "₹")}
            </span>
          </div>
          <span className="inline-block mt-4 text-xs uppercase tracking-[0.15em] text-brand-gold border-b border-brand-gold/30 pb-0.5 transition-colors duration-300 group-hover:border-brand-gold">
            View Project
          </span>
        </div>
      </Link>
    </article>
  );
}

export default function FeaturedProjects({ items }: { items: Property[] }) {
  const featured = items.slice(0, 3);

  return (
    <section className="bg-white py-24 md:py-32">
      <div className="section-shell">
        <div className="text-center mb-16 md:mb-20">
          <p className="section-label mb-4">Curated Selection</p>
          <h2 className="section-heading">Featured Projects</h2>
          <p className="section-body mt-4 max-w-lg mx-auto">
            Handpicked residences across Mumbai&apos;s most sought-after addresses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
          {featured.map((property, i) => (
            <PropertyCard
              key={property.slug}
              property={property}
              fallbackImage={FALLBACK_IMAGES[i % FALLBACK_IMAGES.length]}
            />
          ))}
        </div>

        <div className="text-center mt-16">
          <Link href="/projects" className="btn-gold-outline">
            View All Projects
          </Link>
        </div>
      </div>
    </section>
  );
}
