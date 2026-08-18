import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionProfile } from "@/lib/supabase/getSessionProfile";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "../../broker/SignOutButton";
import PropertiesAdminClient from "./PropertiesAdminClient";

export default async function AdminPropertiesPage() {
  const { user, profile } = await getSessionProfile();

  if (!user) {
    redirect("/broker/login");
  }
  if (!profile || profile.role !== "super_admin") {
    redirect("/broker/login");
  }

  const supabase = await createClient();
  const { data: properties } = await supabase
    .from("properties")
    .select(
      "id, title, slug, city, locality, property_type, price, price_display, bedrooms, bathrooms, area_sqft, rera_number, description, project_status, approval_status, is_featured, images, builder_id, created_at"
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const { data: builders } = await supabase
    .from("builders")
    .select("id, name")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  return (
    <main className="min-h-screen bg-brand-bg text-brand-black">
      <div className="section-shell py-16 md:py-20">
        <div className="flex items-center justify-between mb-16">
          <div>
            <p className="section-label mb-2">Admin</p>
            <h1 className="font-serif text-3xl text-brand-black">Properties</h1>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/admin/brokers"
              className="text-xs uppercase tracking-[0.15em] font-light text-brand-muted hover:text-brand-gold transition-colors duration-300"
            >
              Brokers
            </Link>
            <SignOutButton />
          </div>
        </div>

        <PropertiesAdminClient initialProperties={properties ?? []} builders={builders ?? []} />
      </div>
    </main>
  );
}
