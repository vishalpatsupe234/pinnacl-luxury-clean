import Image from "next/image";

type Property = {
  title: string;
  location?: {
    area?: string;
    city?: string;
  };
  priceDisplay?: string;
  images?: string[];
  highlights?: string[];
  isFeatured?: boolean;
};

export default function PropertyDetails({
  property,
}: {
  property: Property;
}) {
  if (!property) {
    return (
      <div className="py-20 text-center text-gray-500">
        Property details not available.
      </div>
    );
  }

  const {
    title,
    location,
    priceDisplay,
    images = [],
    highlights = [],
    isFeatured,
  } = property;

  return (
    <section className="section-shell py-16">
      {/* HERO */}
      <div className="grid lg:grid-cols-2 gap-12 items-start">
        {/* IMAGE */}
        <div className="relative w-full h-[420px] rounded-2xl overflow-hidden bg-gray-100">
          {images[0] && (
            <Image
              src={images[0]}
              alt={title}
              fill
              priority
              className="object-cover"
            />
          )}
        </div>

        {/* CONTENT */}
        <div>
          {isFeatured && (
            <span className="inline-block mb-3 rounded-full bg-[var(--color-brand-soft)] px-4 py-1 text-xs font-medium text-[var(--color-brand-gold)]">
              Featured Property
            </span>
          )}

          <h1 className="text-3xl md:text-4xl font-playfair mb-2">
            {title}
          </h1>

          <p className="text-[var(--color-brand-muted)] mb-4">
            {location?.area}
            {location?.city ? `, ${location.city}` : ""}
          </p>

          <p className="text-xl font-semibold text-[var(--color-brand-gold)] mb-6">
            {priceDisplay}
          </p>

          <div className="flex flex-wrap gap-4">
            <a
              href="https://wa.me/91XXXXXXXXXX"
              target="_blank"
              className="rounded-xl bg-[var(--color-brand-gold)] px-6 py-3 text-white font-medium"
            >
              WhatsApp Enquiry
            </a>

            <button className="rounded-xl border px-6 py-3 font-medium">
              Schedule Visit
            </button>
          </div>
        </div>
      </div>

      {/* HIGHLIGHTS */}
      {highlights.length > 0 && (
        <div className="mt-12 grid md:grid-cols-2 gap-6 max-w-4xl">
          {highlights.map((point, i) => (
            <div
              key={i}
              className="rounded-xl border bg-white px-6 py-4"
            >
              {point}
            </div>
          ))}
        </div>
      )}

      {/* WHY THIS PROPERTY */}
      <div className="mt-20 max-w-5xl">
        <h2 className="text-2xl md:text-3xl font-playfair mb-4">
          Why {title}
        </h2>

        <p className="text-[var(--color-brand-muted)] max-w-3xl mb-8 leading-relaxed">
          A thoughtfully crafted residence for professionals and families who
          value location, long-term appreciation, and everyday convenience.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-xl border bg-white p-6">
            Prime location with excellent connectivity to key business and
            lifestyle hubs.
          </div>

          <div className="rounded-xl border bg-white p-6">
            Clear ownership and compliance-driven project with long-term
            peace of mind.
          </div>

          <div className="rounded-xl border bg-white p-6">
            Strong rental and resale demand in a consistently performing
            micro-market.
          </div>
        </div>
      </div>
    </section>
  );
}
