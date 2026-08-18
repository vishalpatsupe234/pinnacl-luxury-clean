"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function BrokerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !data.user) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", data.user.id)
      .single();

    if (profile?.role === "super_admin") {
      router.push("/admin/brokers");
      return;
    }

    router.push("/broker/dashboard");
  }

  return (
    <main className="min-h-screen bg-brand-bg text-brand-black flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-12">
          <Link href="/" className="inline-block">
            <span className="font-serif text-2xl tracking-[0.12em] text-brand-black">
              Pinnacl
            </span>
            <span className="block text-[10px] tracking-[0.35em] uppercase text-brand-muted mt-1">
              Properties
            </span>
          </Link>
          <p className="section-label mt-8 mb-2">Broker Access</p>
          <h1 className="font-serif text-2xl text-brand-black">Sign In</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address"
            className="input-light"
          />
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="input-light"
          />

          {error && (
            <p className="text-xs text-red-700/80 font-light">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-gold-outline w-full"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="mt-10 text-center text-xs font-light text-brand-muted leading-relaxed">
          Pinnacl is an invite-only broker network. Accounts are created
          exclusively through an admin-issued invitation — there is no
          public registration.
        </p>
      </div>
    </main>
  );
}
