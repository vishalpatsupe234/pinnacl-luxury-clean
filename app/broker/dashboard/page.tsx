import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionProfile } from "@/lib/supabase/getSessionProfile";
import SignOutButton from "../SignOutButton";

// One notice per non-active status. Previously this was a two-way
// ternary on `rejected`, which meant every other non-active status —
// including `suspended` — fell through to the "Pending Approval" copy
// and told a suspended broker their account was still under review.
// Keyed explicitly so a new status value surfaces as its own case
// rather than silently inheriting the pending wording.
const STATUS_NOTICES = {
  pending_approval: {
    heading: "Pending Approval",
    body: "Your account has been created and is awaiting review by a Pinnacl administrator. You'll be able to access the dashboard once approved.",
  },
  rejected: {
    heading: "Application Not Approved",
    body: "Your broker application was not approved. Please contact your Pinnacl administrator for details.",
  },
  suspended: {
    heading: "Account Suspended",
    body: "Your broker account has been suspended. Please contact the Pinnacl administrator for assistance.",
  },
} as const;

// Gated placeholder. Per this task's scope, no property/lead/
// commission functionality lives here yet — this page exists
// only to prove the access-control requirement: an unapproved
// broker cannot reach dashboard content.
export default async function BrokerDashboardPage() {
  const { user, profile } = await getSessionProfile();

  if (!user) {
    redirect("/broker/login");
  }

  if (!profile || (profile.role !== "verified_broker" && profile.role !== "sales_partner")) {
    redirect("/broker/login");
  }

  if (profile.status !== "active") {
    const notice = STATUS_NOTICES[profile.status] ?? STATUS_NOTICES.pending_approval;

    return (
      <main className="min-h-screen bg-brand-bg text-brand-black flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <p className="section-label mb-4">Broker Account</p>
          <h1 className="font-serif text-2xl text-brand-black mb-4">{notice.heading}</h1>
          <p className="text-sm font-light text-brand-muted leading-relaxed mb-8">
            {notice.body}
          </p>
          <SignOutButton />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-bg text-brand-black">
      <div className="section-shell py-16 md:py-20">
        <div className="flex items-center justify-between mb-16">
          <div>
            <p className="section-label mb-2">Broker Dashboard</p>
            <h1 className="font-serif text-3xl text-brand-black">
              Welcome, {profile.full_name || "Broker"}
            </h1>
          </div>
          <SignOutButton />
        </div>

        <p className="text-sm font-light text-brand-muted max-w-lg mb-8">
          Your account is active. Leads and commission tracking are not part
          of this phase yet.
        </p>

        <Link href="/broker/properties" className="btn-gold-outline">
          View Properties
        </Link>
      </div>
    </main>
  );
}
