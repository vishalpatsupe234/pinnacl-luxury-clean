import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PropertiesClient from "@/components/PropertiesClient";
import {
  publicPropertySurfacesEnabled,
  PRE_REGISTRATION_NOTICE,
} from "@/lib/compliance/publicMode";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://pinnaclproperties.com";

export const metadata: Metadata = {
  title: "Luxury Properties in Maharashtra",
  description:
    "Browse luxury properties in Maharashtra with pricing and location details from Pinnacl Properties. Project registration numbers are shown on each listing where we hold them.",
  alternates: {
    canonical: `${siteUrl}/properties`,
  },
  openGraph: {
    title: "Luxury Properties in Maharashtra",
    description:
      "Browse luxury properties in Maharashtra with pricing and location details from Pinnacl Properties. Project registration numbers are shown on each listing where we hold them.",
    url: `${siteUrl}/properties`,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Luxury Properties in Maharashtra",
    description:
      "Browse luxury properties in Maharashtra with pricing and location details from Pinnacl Properties. Project registration numbers are shown on each listing where we hold them.",
  },
};

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  // Pre-registration mode: serve a holding notice and never query inventory.
  // The listings still exist and remain fully manageable in the admin CMS —
  // they are simply not advertised publicly.
  if (!publicPropertySurfacesEnabled()) {
    return (
      <section className="container mx-auto px-4 py-24 max-w-2xl">
        <h1 className="font-serif text-3xl mb-4">
          {PRE_REGISTRATION_NOTICE.heading}
        </h1>
        <p className="text-sm font-light leading-relaxed text-brand-muted mb-8">
          {PRE_REGISTRATION_NOTICE.body}
        </p>
        <Link href="/contact" className="btn-gold-outline">
          Contact Us
        </Link>
      </section>
    );
  }

  const supabase = await createClient();

  // Public surface: the visibility rule is enforced explicitly below, not
  // delegated to RLS. RLS policies are OR'd, so properties_broker_read_all
  // (any active broker) and properties_admin_full_access would otherwise
  // also match pending_review, rejected and soft-deleted rows for a
  // logged-in staff session. PropertiesList.tsx repeats these same two
  // filters for the client-side re-query when filters change.
  //
  // Explicit column list, never "*": only the fields PropertyCardLux renders
  // reach the client component payload. Internal linkage/provenance columns
  // (source_broker_id, project_id, inventory_unit_id, migration_state) must
  // never be selected here. Must match the list in PropertiesList.tsx.
  const { data: items, error } = await supabase
    .from("properties")
    .select("id, slug, title, images, is_featured, locality, city, price, price_display")
    .eq("approval_status", "approved")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase Error:", error);
  }

  return (
    <section className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Properties</h1>
      <PropertiesClient initialItems={items ?? []} />
    </section>
  );
}