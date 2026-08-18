import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionProfile } from "@/lib/supabase/getSessionProfile";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "../../broker/SignOutButton";
import BrokersAdminClient from "./BrokersAdminClient";

export default async function AdminBrokersPage() {
  const { user, profile } = await getSessionProfile();

  if (!user) {
    redirect("/broker/login");
  }
  if (!profile || profile.role !== "super_admin") {
    redirect("/broker/login");
  }

  const supabase = await createClient();

  const { data: pendingBrokers } = await supabase
    .from("profiles")
    .select("id, full_name, role, status, kyc_status, created_at")
    .eq("status", "pending_approval")
    .order("created_at", { ascending: true });

  const { data: activeBrokers } = await supabase
    .from("profiles")
    .select("id, full_name, role, status, kyc_status, created_at")
    .in("role", ["verified_broker", "sales_partner"])
    .neq("status", "pending_approval")
    .order("created_at", { ascending: false });

  const { data: invites } = await supabase
    .from("invites")
    .select("id, email, role, status, expires_at, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <main className="min-h-screen bg-brand-bg text-brand-black">
      <div className="section-shell py-16 md:py-20">
        <div className="flex items-center justify-between mb-16">
          <div>
            <p className="section-label mb-2">Admin</p>
            <h1 className="font-serif text-3xl text-brand-black">Brokers</h1>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/admin/properties"
              className="text-xs uppercase tracking-[0.15em] font-light text-brand-muted hover:text-brand-gold transition-colors duration-300"
            >
              Properties
            </Link>
            <SignOutButton />
          </div>
        </div>

        <BrokersAdminClient
          initialPending={pendingBrokers ?? []}
          initialActive={activeBrokers ?? []}
          initialInvites={invites ?? []}
        />
      </div>
    </main>
  );
}
