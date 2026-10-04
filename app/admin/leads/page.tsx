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
  // Authenticated but not an admin: send them to their own area, NOT to the
  // login page. Previously this also redirected to /broker/login, which made
  // "you are not signed in" and "you are signed in but not permitted"
  // indistinguishable — a signed-in broker was shown a login form and
  // reasonably concluded their session had expired.
  //
  // A null profile also lands on /broker/dashboard, whose own guard then sends
  // it to /broker/login. That is two hops and terminates; it cannot loop,
  // because the dashboard never redirects back into /admin/*.
  if (!profile || profile.role !== "super_admin") {
    redirect("/broker/dashboard");
  }

  const supabase = await createClient();

  // Active AND archived are both fetched, and `deleted_at` is now selected so
  // the client can split them. The Active view remains the default and still
  // shows only rows with deleted_at = null — the filter moved from the query
  // into the view toggle, it was not removed.
  //
  // One query rather than two, matching how this page already filters search
  // and stage client-side. At current volume that is the smaller change; the
  // absence of pagination on this page is pre-existing and unchanged here.
  const { data: leads } = await supabase
    .from("leads")
    .select(
      "id, property_id, buyer_name, buyer_phone, buyer_email, message, assigned_broker_id, status, lead_source, assigned_at, contacted_at, next_action_at, budget_min, budget_max, configuration, preferred_locality, purpose, timeline, financing_status, created_at, deleted_at"
    )
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
