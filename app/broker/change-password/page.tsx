import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionProfile } from "@/lib/supabase/getSessionProfile";
import SignOutButton from "../SignOutButton";
import ChangePasswordForm from "./ChangePasswordForm";

// Authenticated self-service password change.
//
// GATED ON AUTHENTICATION ONLY — deliberately NOT on role or status.
//
// Every sibling page under /broker additionally requires
// role in ('verified_broker','sales_partner') and status = 'active', and
// this page intentionally breaks that pattern. Changing your own password is
// an account-security action, not a broker capability: a pending_approval,
// suspended or rejected user, and the super_admin, all have an equally
// legitimate reason to rotate a credential — arguably more so, since a
// suspended account is exactly the one whose password you might want changed.
// Restricting this page to active brokers would lock the people most likely
// to need it out of it.
//
// Nothing here grants access to any broker DATA. The page renders a form and
// nothing else; the session refresh in proxy.ts already covers /broker/*.
export default async function BrokerChangePasswordPage() {
  const { user } = await getSessionProfile();

  if (!user) {
    redirect("/broker/login");
  }

  return (
    <main className="min-h-screen bg-brand-bg text-brand-black">
      <div className="section-shell py-16 md:py-20">
        <div className="flex items-center justify-between mb-16">
          <div>
            <p className="section-label mb-2">Account</p>
            <h1 className="font-serif text-3xl text-brand-black">Change Password</h1>
          </div>
          <SignOutButton />
        </div>

        <div className="max-w-sm">
          {/* The signed-in identity is shown so it is unambiguous WHICH
              account is about to be changed — the one risk of a page like
              this is someone rotating the wrong account's credential while
              two sessions are open. The email is already the viewer's own,
              so nothing is disclosed that they do not have. */}
          <p className="text-sm font-light text-brand-muted leading-relaxed mb-10">
            You are signed in as{" "}
            <span className="text-brand-black">{user.email}</span>. Choose a new
            password for this account.
          </p>

          <ChangePasswordForm />

          <p className="mt-12 text-xs font-light text-brand-muted">
            <Link
              href="/broker/dashboard"
              className="uppercase tracking-[0.15em] hover:text-brand-gold transition-colors duration-300"
            >
              ← Back to dashboard
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
