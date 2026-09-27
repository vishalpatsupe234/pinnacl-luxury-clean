"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Lead = {
  id: string;
  property_id: string | null;
  buyer_name: string;
  buyer_phone: string | null;
  buyer_email: string | null;
  message: string | null;
  assigned_broker_id: string | null;
  status: string;
  created_at: string;
};

const STAGES: { value: string; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "site_visit", label: "Site Visit" },
  { value: "negotiation", label: "Negotiation" },
  { value: "closed", label: "Closed" },
  { value: "lost", label: "Lost" },
];

export default function LeadsBrokerClient({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [saveError, setSaveError] = useState("");

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const matchesSearch =
        !search ||
        l.buyer_name.toLowerCase().includes(search.toLowerCase()) ||
        (l.buyer_phone ?? "").includes(search);
      const matchesStage = !stageFilter || l.status === stageFilter;
      return matchesSearch && matchesStage;
    });
  }, [leads, search, stageFilter]);

  // Optimistic update with rollback — same pattern as the admin client.
  //
  // Previously the response was discarded, so a 403 (lead no longer assigned
  // to this broker, or account suspended mid-session) or a 500 left the
  // dropdown showing a stage the database never accepted.
  //
  // The previous stage is captured and restored on any non-2xx or network
  // failure. Stage remains the only field a broker can change; nothing here
  // adds assignment capability.
  async function updateStage(id: string, status: string) {
    const previousStatus = leads.find((l) => l.id === id)?.status;
    if (previousStatus === undefined) return;

    setSaveError("");
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));

    const rollback = () => {
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: previousStatus } : l))
      );
      setSaveError("Could not save this change. Please try again.");
    };

    try {
      const res = await fetch(`/api/broker/leads/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        rollback();
      }
    } catch {
      rollback();
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-4 mb-10">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone"
          className="input-light sm:max-w-xs"
        />
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="input-light sm:max-w-[200px]"
        >
          <option value="">All Stages</option>
          {STAGES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {saveError && (
        <p className="mb-4 text-xs font-light text-red-700/80">{saveError}</p>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm font-light text-brand-muted">No leads assigned to you yet.</p>
      ) : (
        <div className="divide-y divide-brand-border border-t border-b border-brand-border">
          {filtered.map((l) => (
            <div
              key={l.id}
              className="py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <Link href={`/broker/leads/${l.id}`} className="group">
                <p className="text-brand-black group-hover:text-brand-gold transition-colors">
                  {l.buyer_name}
                </p>
                <p className="text-xs font-light text-brand-muted mt-0.5">
                  {[l.buyer_phone, l.buyer_email].filter(Boolean).join(" · ") || "—"}
                </p>
              </Link>

              <div className="flex items-center gap-4">
                <select
                  value={l.status}
                  onChange={(e) => updateStage(l.id, e.target.value)}
                  className="input-light text-xs py-2"
                >
                  {STAGES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <Link
                  href={`/broker/leads/${l.id}`}
                  className="text-xs uppercase tracking-[0.15em] font-light text-brand-gold hover:text-brand-gold/70 transition-colors whitespace-nowrap"
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
