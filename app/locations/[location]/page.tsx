import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { NEARBY_LOCATIONS } from "../location-map";

/* ---------------- TYPES ---------------- */
type Project = {
  id: string;
  title: string;
  slug: string;
  location: {
    area: string;
    city: string;
  };
  images: string[];
};

/* ---------------- LOCATION COPY ---------------- */
const LOCATION_INFO: Record<string, { title: string; intro: string }> = {
  powai: {
    title: "Luxury Homes in Powai",
    intro:
      "Powai is a premium residential and commercial hub known for planned infrastructure, greenery, and strong connectivity."
  },
  ambernath: {
    title: "Residential Developments Around Ambernath",
    intro:
      "Ambernath is a growing residential belt near Thane, preferred for value-driven homes and improving connectivity."
  },
  kalyan: {
    title: "Residential Developments in Kalyan",
    intro:
      "Kalyan offers well-connected residential neighbourhoods with a mix of modern developments and established infrastructure."
  }
};

function formatLocation(slug: string) {
  return slug
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/* ---------------- SEO META ---------------- */
export async function generateMetadata({
  params
}: {
  params: Promise<{ location: string }>;
}) {
  const { location } = await params;
  const formatted = formatLocation(location);

  return {
    title: `Luxury Homes in ${formatted} | Pinnacl Properties`,
    description: `Explore handpicked residential developments in and around ${formatted}. Trusted advisory for quality homes, legal clarity, and long-term value.`
  };
}

/* ---------------- PAGE ---------------- */
export default async function LocationPage({
  params
}: {
  params: Promise<{ location: string }>;
}) {
  const { location } = await params;
  const locationSlug = location.toLowerCase();

  const res = await fetch("http://localhost:3000/api/properties", {
    cache: "no-store"
  });

  if (!res.ok) notFound();

  const data = await res.json();
  const items: Project[] = Array.isArray(data?.items) ? data.items : [];

  /* DIRECT LOCATION MATCH */
  const directProjects = items.filter(p =>
    p.location?.area?.toLowerCase().includes(locationSlug)
  );

  /* NEARBY LOGIC */
  const nearbySlugs = NEARBY_LOCATIONS[locationSlug] ?? [];

  const nearbyProjects = items.filter(p =>
    nearbySlugs.some(slug =>
      p.location?.area?.toLowerCase().includes(slug)
    )
  );

  const info = LOCATION_INFO[locationSlug];

  const title =
    info?.title ??
    `Residential Developments Around ${formatLocation(locationSlug)}`;

  const intro =
    info?.intro ??
    "We selectively present residential developments based on construction quality, legal clarity, and long-term livability.";

  return (
    <main className="max-w-6xl mx-auto px-6 py-28">
      {/* ---------------- HERO ---------------- */}
      <section className="mb-24 max-w-3xl animate-fade-in">
        <h1 className="text-[42px] leading-tight font-light tracking-tight mb-6">
          {title}
        </h1>

        <p className="text-[15px] leading-relaxed text-gray-500 max-w-2xl">
          {intro}
        </p>
      </section>

      {/* ---------------- DIRECT PROJECTS ---------------- */}
      {directProjects.length > 0 && (
        <section className="mb-28">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-14">
            {directProjects.map(project => (
              <Link
                key={project.id}
                href={`/properties/${project.slug}`}
                className="property-card-lux ultra-pro group"
              >
                {/* IMAGE */}
                <div className="relative img-wrap">
                  <Image
                    src={project.images?.[0]}
                    alt={project.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjY2IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iNjYiIGZpbGw9IiNlZWVlZWUiIC8+PC9zdmc+"
                  />
                  <span className="img-sheen" />
                </div>

                {/* CONTENT */}
                <div className="card-body">
                  <span className="tag">Selected</span>

                  <h4>{project.title}</h4>

                  <p className="location">
                    {project.location.area}, {project.location.city}
                  </p>

                  {/* CTA PILL */}
                  <span className="card-cta">
                    View Private Details →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ---------------- FALLBACK + NEARBY ---------------- */}
      {directProjects.length === 0 && (
        <section className="max-w-3xl">
          <p className="text-[15px] leading-relaxed text-gray-500 mb-20 max-w-2xl">
            We currently work with a limited number of developments directly in
            this area. Based on similar preferences, nearby locations may be more
            suitable.
          </p>

          {/* NEARBY LOCATIONS */}
          {nearbySlugs.length > 0 && (
            <div className="mb-24">
              <h2 className="text-[18px] font-light mb-6">
                Nearby locations worth considering
              </h2>

              <div className="flex flex-wrap gap-3">
                {nearbySlugs.map(slug => (
                  <Link
                    key={slug}
                    href={`/locations/${slug}`}
                    className="
                      px-5 py-2 text-[13px] tracking-wide
                      border border-neutral-300 rounded-full
                      text-neutral-700
                      hover:border-black hover:text-black
                      transition-all duration-300
                    "
                  >
                    {formatLocation(slug)}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* NEARBY PROJECTS */}
          {nearbyProjects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-14 mb-28">
              {nearbyProjects.map(project => (
                <Link
                  key={project.id}
                  href={`/properties/${project.slug}`}
                  className="property-card-lux ultra-pro group"
                >
                  <div className="relative img-wrap">
                    <Image
                      src={project.images?.[0]}
                      alt={project.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjY2IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iNjYiIGZpbGw9IiNlZWVlZWUiIC8+PC9zdmc+"
                    />
                    <span className="img-sheen" />
                  </div>

                  <div className="card-body">
                    <span className="tag">Nearby</span>

                    <h4>{project.title}</h4>

                    <p className="location">
                      {project.location.area}, {project.location.city}
                    </p>

                    <span className="card-cta">
                      View Private Details →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* FINAL CTA */}
          <Link
            href="/contact"
            className="
              inline-flex items-center gap-2
              px-8 py-3 text-[13px] tracking-wide
              border border-black rounded-full
              hover:bg-black hover:text-white
              transition-all duration-300
            "
          >
            Request a Private Recommendation
          </Link>
        </section>
      )}
    </main>
  );
}
