import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/supabase/getSessionProfile";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "../SignOutButton";
import LeadsBrokerClient from "./LeadsBrokerClient";

export default async function BrokerLeadsPage() {
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
  // No assigned_broker_id filter needed — leads_broker_read_assigned
  // RLS already returns only this broker's own leads.
  const { data: leads } = await supabase
    .from("leads")
    .select(
      "id, property_id, buyer_name, buyer_phone, buyer_email, message, assigned_broker_id, status, created_at"
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-brand-bg text-brand-black">
      <div className="section-shell py-16 md:py-20">
        <div className="flex items-center justify-between mb-16">
          <div>
            <p className="section-label mb-2">Broker</p>
            <h1 className="font-serif text-3xl text-brand-black">My Leads</h1>
          </div>
          <SignOutButton />
        </div>

        <LeadsBrokerClient initialLeads={leads ?? []} />
      </div>
    </main>
  );
}
