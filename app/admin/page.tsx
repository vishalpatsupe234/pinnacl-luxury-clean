import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/supabase/getSessionProfile";

// /admin — index route.
//
// Previously this path did not exist, so typing /admin produced a bare
// Next.js 404 even for a signed-in admin, while the real entry point was
// /admin/brokers. There was no way to discover that from the URL.
//
// This route renders nothing. It exists only to resolve /admin to the admin
// landing page, and it applies the SAME guard as every other /admin/* page so
// it cannot become a softer door than the pages it leads to:
//
//   not signed in            -> /broker/login
//   signed in, not an admin  -> /broker/dashboard   (never the login page)
//   signed in as super_admin -> /admin/brokers
//
// No role definition is introduced or changed here: "super_admin" is the same
// value used by profiles.role's CHECK constraint, by is_super_admin() in RLS,
// and by the three existing admin pages.
export default async function AdminIndexPage() {
  const { user, profile } = await getSessionProfile();

  if (!user) {
    redirect("/broker/login");
  }

  if (!profile || profile.role !== "super_admin") {
    redirect("/broker/dashboard");
  }

  redirect("/admin/brokers");
}
