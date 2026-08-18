import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSessionProfile } from "@/lib/supabase/getSessionProfile";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "../../SignOutButton";
import PropertyCarousel from "./PropertyCarousel";

const STATUS_LABELS: Record<string, string> = {
  under_construction: "Under Construction",
  ready_to_move: "Ready to Move",
  sold_out: "Sold Out",
};

type Params = { params: Promise<{ id: string }> };

export default async function BrokerPropertyDetailPage({ params }: Params) {
  const { id } = await params;
  const { user, profile } = await getSessionProfile();

  if (!user) {
    redirect("/broker/login");
  }
  if (!profile || (profile.role !== "verified_broker" && profile.role !== "sales_partner")) {
    redirect("/broker/login");
  }
  if (profile.status !== "active") {
    redirect("/broker/dashboard");
  }

  const supabase = await createClient();
  const { data: property } = await supabase
    .from("properties")
    .select(
      "id, title, city, locality, property_type, price, price_display, bedrooms, bathrooms, area_sqft, rera_number, description, project_status, is_featured, images"
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!property) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-brand-bg text-brand-black">
      <div className="section-shell py-16 md:py-20">
        <div className="flex items-center justify-between mb-12">
          <Link
            href="/broker/properties"
            className="text-xs uppercase tracking-[0.15em] font-light text-brand-muted hover:text-brand-gold transition-colors duration-300"
          >
            ← All Properties
          </Link>
          <SignOutButton />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          <PropertyCarousel images={property.images ?? []} alt={property.title} />

          <div>
            {property.is_featured && (
              <p className="text-[10px] uppercase tracking-[0.25em] text-brand-gold mb-3">
                Featured
              </p>
            )}
            <h1 className="font-serif text-3xl text-brand-black mb-2">{property.title}</h1>
            <p className="text-sm font-light text-brand-muted mb-8">
              {[property.city, property.locality].filter(Boolean).join(", ") || "—"}
            </p>

            <p className="font-serif text-2xl text-brand-black mb-10">
              {property.price_display ||
                (property.price ? `₹${property.price.toLocaleString()}` : "Price on request")}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-10 pb-10 border-b border-brand-border">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-brand-muted mb-1">Type</p>
                <p className="text-sm text-brand-black font-light">{property.property_type || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-brand-muted mb-1">Status</p>
                <p className="text-sm text-brand-black font-light">
                  {STATUS_LABELS[property.project_status] || property.project_status}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-brand-muted mb-1">
                  Bedrooms
                </p>
                <p className="text-sm text-brand-black font-light">{property.bedrooms ?? "—"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-brand-muted mb-1">
                  Bathrooms
                </p>
                <p className="text-sm text-brand-black font-light">{property.bathrooms ?? "—"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-brand-muted mb-1">Area</p>
                <p className="text-sm text-brand-black font-light">
                  {property.area_sqft ? `${property.area_sqft} sq.ft` : "—"}
                </p>
              </div>
              {property.rera_number && (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-brand-muted mb-1">
                    RERA Number
                  </p>
                  <p className="text-sm text-brand-black font-light">{property.rera_number}</p>
                </div>
              )}
            </div>

            {property.description && (
              <p className="text-sm font-light text-brand-muted leading-relaxed">
                {property.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
