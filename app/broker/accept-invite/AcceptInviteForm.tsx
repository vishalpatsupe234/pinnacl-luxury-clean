"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type ValidationState = "checking" | "valid" | "invalid";

export default function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [state, setState] = useState<ValidationState>(() =>
    token ? "checking" : "invalid"
  );
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }
    fetch(`/api/broker/accept-invite?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.valid) {
          setEmail(data.email);
          setState("valid");
        } else {
          setState("invalid");
        }
      })
      .catch(() => setState("invalid"));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/broker/accept-invite", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password, fullName }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      setDone(true);
      setTimeout(() => router.push("/broker/login"), 2500);
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (state === "checking") {
    return <p className="text-sm font-light text-brand-muted text-center">Checking your invite…</p>;
  }

  if (state === "invalid") {
    return (
      <div className="text-center">
        <p className="font-serif text-xl text-brand-black mb-3">Invite Not Valid</p>
        <p className="text-sm font-light text-brand-muted leading-relaxed">
          This invite link is invalid, has already been used, or has expired.
          Please contact your Pinnacl administrator for a new invitation.
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center animate-fade-in">
        <p className="font-serif text-xl text-brand-black mb-3">Account Created</p>
        <p className="text-sm font-light text-brand-muted">
          Redirecting you to sign in…
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-10">
        <p className="section-label mb-2">Broker Invitation</p>
        <h1 className="font-serif text-2xl text-brand-black mb-2">Set Up Your Account</h1>
        <p className="text-sm font-light text-brand-muted">{email}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Full Name"
          className="input-light"
        />
        <input
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Create Password"
          className="input-light"
        />
        <input
          required
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm Password"
          className="input-light"
        />

        {error && <p className="text-xs text-red-700/80 font-light">{error}</p>}

        <button type="submit" disabled={submitting} className="btn-gold-outline w-full">
          {submitting ? "Creating Account…" : "Create Account"}
        </button>
      </form>

      <p className="mt-10 text-center text-xs font-light text-brand-muted leading-relaxed">
        Your account will require admin approval before dashboard access is
        granted. Already have an account?{" "}
        <Link href="/broker/login" className="text-brand-gold hover:text-brand-gold/80">
          Sign in
        </Link>
      </p>
    </>
  );
}
