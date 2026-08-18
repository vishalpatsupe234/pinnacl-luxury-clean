"use client";

import { useState } from "react";

type Profile = {
  id: string;
  full_name: string | null;
  role: string;
  status: string;
  kyc_status: string;
  created_at: string;
};

type Invite = {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
};

type Props = {
  initialPending: Profile[];
  initialActive: Profile[];
  initialInvites: Invite[];
};

export default function BrokersAdminClient({
  initialPending,
  initialActive,
  initialInvites,
}: Props) {
  const [pending, setPending] = useState(initialPending);
  const [active] = useState(initialActive);
  const [invites, setInvites] = useState(initialInvites);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"verified_broker" | "sales_partner">("verified_broker");
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [actingOn, setActingOn] = useState<string | null>(null);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setInviteError("");
    setInviteLink("");

    try {
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setInviteError(data.error || "Could not create invite.");
        return;
      }

      setInviteLink(data.invite.inviteUrl);
      setInvites((prev) => [
        {
          id: crypto.randomUUID(),
          email: data.invite.email,
          role: data.invite.role,
          status: "pending",
          expires_at: data.invite.expiresAt,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setEmail("");
    } finally {
      setInviting(false);
    }
  }

  async function handleDecision(id: string, action: "approve" | "reject") {
    setActingOn(id);
    try {
      const res = await fetch(`/api/admin/brokers/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setPending((prev) => prev.filter((p) => p.id !== id));
      }
    } finally {
      setActingOn(null);
    }
  }

  return (
    <div className="space-y-20">
      {/* Invite a broker */}
      <section>
        <p className="section-label mb-6">Invite a Broker</p>
        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4 max-w-2xl">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="broker@example.com"
            className="input-light flex-1"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "verified_broker" | "sales_partner")}
            className="input-light sm:max-w-[180px]"
          >
            <option value="verified_broker">Verified Broker</option>
            <option value="sales_partner">Sales Partner</option>
          </select>
          <button type="submit" disabled={inviting} className="btn-gold-outline">
            {inviting ? "Sending…" : "Create Invite"}
          </button>
        </form>

        {inviteError && (
          <p className="mt-4 text-xs text-red-700/80 font-light">{inviteError}</p>
        )}

        {inviteLink && (
          <div className="mt-6 p-4 border border-brand-border bg-white max-w-2xl">
            <p className="text-xs uppercase tracking-[0.15em] text-brand-muted mb-2">
              Invite Link — share with the broker
            </p>
            <p className="text-sm font-light text-brand-black break-all">{inviteLink}</p>
          </div>
        )}
      </section>

      {/* Pending approval */}
      <section>
        <p className="section-label mb-6">Pending Approval ({pending.length})</p>
        {pending.length === 0 ? (
          <p className="text-sm font-light text-brand-muted">No brokers awaiting approval.</p>
        ) : (
          <div className="divide-y divide-brand-border border-t border-b border-brand-border max-w-3xl">
            {pending.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm text-brand-black">{p.full_name || "(no name provided)"}</p>
                  <p className="text-xs font-light text-brand-muted mt-0.5">
                    {p.role.replace("_", " ")} · KYC: {p.kyc_status}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDecision(p.id, "approve")}
                    disabled={actingOn === p.id}
                    className="text-xs uppercase tracking-[0.15em] font-light text-brand-gold hover:text-brand-gold/70 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleDecision(p.id, "reject")}
                    disabled={actingOn === p.id}
                    className="text-xs uppercase tracking-[0.15em] font-light text-brand-muted hover:text-brand-black transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Active / rejected brokers */}
      <section>
        <p className="section-label mb-6">Brokers ({active.length})</p>
        {active.length === 0 ? (
          <p className="text-sm font-light text-brand-muted">No brokers yet.</p>
        ) : (
          <div className="divide-y divide-brand-border border-t border-b border-brand-border max-w-3xl">
            {active.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-4">
                <p className="text-sm text-brand-black">{p.full_name || "(no name provided)"}</p>
                <p className="text-xs uppercase tracking-[0.15em] font-light text-brand-muted">
                  {p.status}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent invites */}
      <section>
        <p className="section-label mb-6">Recent Invites</p>
        {invites.length === 0 ? (
          <p className="text-sm font-light text-brand-muted">No invites sent yet.</p>
        ) : (
          <div className="divide-y divide-brand-border border-t border-b border-brand-border max-w-3xl">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-4">
                <p className="text-sm text-brand-black">{inv.email}</p>
                <p className="text-xs uppercase tracking-[0.15em] font-light text-brand-muted">
                  {inv.status}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
