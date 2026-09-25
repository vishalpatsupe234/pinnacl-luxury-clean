import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/supabase/getSessionProfile";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "../../broker/SignOutButton";
import LeadsAdminClient from "./LeadsAdminClient";

export default async function AdminLeadsPage() {
  const { user, profile } = await getSessionProfile();

  if (!user) {
    redirect("/broker/login");
  }
  if (!profile || profile.role !== "super_admin") {
    redirect("/broker/login");
  }

  const supabase = await createClient();

  const { data: leads } = await supabase
    .from("leads")
    .select(
      "id, property_id, buyer_name, buyer_phone, buyer_email, message, assigned_broker_id, status, created_at"
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const { data: brokers } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("role", ["verified_broker", "sales_partner"])
    .eq("status", "active")
    .order("full_name", { ascending: true });

  const { data: properties } = await supabase
    .from("properties")
    .select("id, title")
    .is("deleted_at", null)
    .order("title", { ascending: true });

  return (
    <main className="min-h-screen bg-brand-bg text-brand-black">
      <div className="section-shell py-16 md:py-20">
        <div className="flex items-center justify-between mb-16">
          <div>
            <p className="section-label mb-2">Admin</p>
            <h1 className="font-serif text-3xl text-brand-black">Leads</h1>
          </div>
          <SignOutButton />
        </div>

        <LeadsAdminClient
          initialLeads={leads ?? []}
          brokers={brokers ?? []}
          properties={properties ?? []}
        />
      </div>
    </main>
  );
}
