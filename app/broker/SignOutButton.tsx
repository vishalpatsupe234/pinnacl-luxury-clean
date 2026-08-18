"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/broker/login");
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-xs uppercase tracking-[0.15em] font-light text-brand-muted hover:text-brand-gold transition-colors duration-300"
    >
      Sign Out
    </button>
  );
}
