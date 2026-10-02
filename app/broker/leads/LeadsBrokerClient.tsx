"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LEAD_SOURCE_LABELS, type LeadSource } from "@/lib/supabase/types";
import {
  formatDate,
  formatDateTime,
  isFollowUpDue,
  toDateInputValue,
} from "@/lib/leads/leadDisplay";
import LeadRequirementsPanel from "@/components/LeadRequirementsPanel";

type Lead = {
  id: string;
  property_id: string | null;
  buyer_name: string;
  buyer_phone: string | null;
  buyer_email: string | null;
  message: string | null;
  assigned_broker_id: string | null;
  status: string;
  lead_source: string | null;
  assigned_at: string | null;
  contacted_at: string | null;
  next_action_at: string | null;
  budget_min: number | null;
  budget_max: number | null;
  configuration: string | null;
  preferred_locality: string | null;
  purpose: string | null;
  timeline: string | null;
  financing_status: string | null;
  created_at: string;
};

// Source is READ-ONLY for a broker — displayed, never edited. Correcting a
// channel is an admin action, and lead_source is one of the columns the
// leads_broker_column_guard trigger refuses a broker write on, so offering a
// control here would produce an error rather than a change.
function sourceLabel(value: string | null): string {
  if (!value) return "Not recorded";
  return LEAD_SOURCE_LABELS[value as LeadSource] ?? value;
}

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

  // "Now" is sampled ONCE, via a lazy state initializer, rather than read
  // during every render. Reading the clock inline would give each re-render a
  // different answer and could flip a follow-up's styling mid-interaction;
  // holding it in state keeps the row stable for the life of the page.
  const [nowMs] = useState(() => Date.now());
  // Requirement panel state, matching the admin client.
  const [reqExpandedId, setReqExpandedId] = useState<string | null>(null);
  const [savingReq, setSavingReq] = useState(false);
  const [reqError, setReqError] = useState("");

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
  // Widened from a stage-only helper to a general patch now that a broker has
  // three writable fields instead of one, and the whole previous row is
  // captured rather than a single value — the same change the admin client
  // already made, and for the same reason: restoring only the patched key can
  // leave a half-applied multi-key patch on screen.
  //
  // This adds NO capability. The three fields below are the only ones the
  // broker API will build an update from, and the leads_broker_column_guard
  // trigger rejects anything else even if this route were bypassed entirely.
  async function updateLead(id: string, patch: Record<string, unknown>) {
    const previous = leads.find((l) => l.id === id);
    if (!previous) return;

    setSaveError("");
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));

    const rollback = () => {
      setLeads((prev) => prev.map((l) => (l.id === id ? previous : l)));
      setSaveError("Could not save this change. Please try again.");
    };

    try {
      const res = await fetch(`/api/broker/leads/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });

      if (!res.ok) {
        rollback();
      }
    } catch {
      rollback();
    }
  }

  // Requirements are broker-writable by design: the broker on the call is the
  // person who learns them. The broker API accepts these seven fields and the
  // column guard permits them; nothing protected was widened.
  async function handleSaveRequirements(
    leadId: string,
    patch: Record<string, unknown>
  ) {
    setSavingReq(true);
    setReqError("");
    try {
      const res = await fetch(`/api/broker/leads/${leadId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setReqError(data?.error || "Could not save the requirement.");
        return;
      }
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId
            ? {
                ...l,
                budget_min: patch.budget_min === "" ? null : Number(patch.budget_min),
                budget_max: patch.budget_max === "" ? null : Number(patch.budget_max),
                configuration: (patch.configuration as string) || null,
                preferred_locality: (patch.preferred_locality as string) || null,
                purpose: (patch.purpose as string) || null,
                timeline: (patch.timeline as string) || null,
                financing_status: (patch.financing_status as string) || null,
              }
            : l
        )
      );
      setReqExpandedId(null);
    } catch {
      setReqError("Could not save the requirement.");
    } finally {
      setSavingReq(false);
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
            <div key={l.id} className="py-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <Link href={`/broker/leads/${l.id}`} className="group">
                  <p className="text-brand-black group-hover:text-brand-gold transition-colors">
                    {l.buyer_name}
                  </p>
                  <p className="text-xs font-light text-brand-muted mt-0.5">
                    {[l.buyer_phone, l.buyer_email].filter(Boolean).join(" · ") || "—"}
                  </p>
                  {/* The broker's own working prompt: either they have not
                      called yet, or a follow-up they planned has come due. */}
                  {(!l.contacted_at || isFollowUpDue(l.next_action_at, nowMs)) && (
                    <span className="block text-[10px] uppercase tracking-[0.15em] font-light text-brand-gold mt-1.5">
                      {[
                        !l.contacted_at ? "Not contacted" : null,
                        isFollowUpDue(l.next_action_at, nowMs) ? "Follow-up due" : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  )}
                </Link>

                <div className="flex items-center gap-4">
                  <select
                    value={l.status}
                    onChange={(e) => updateLead(l.id, { status: e.target.value })}
                    className="input-light text-xs py-2"
                  >
                    {STAGES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      setReqError("");
                      setReqExpandedId(reqExpandedId === l.id ? null : l.id);
                    }}
                    className="text-xs uppercase tracking-[0.15em] font-light text-brand-gold hover:text-brand-gold/70 transition-colors whitespace-nowrap"
                  >
                    {reqExpandedId === l.id ? "Hide" : "Requirement"}
                  </button>
                  <Link
                    href={`/broker/leads/${l.id}`}
                    className="text-xs uppercase tracking-[0.15em] font-light text-brand-gold hover:text-brand-gold/70 transition-colors whitespace-nowrap"
                  >
                    View
                  </Link>
                </div>
              </div>

              {/* Source and assignment date are read-only here; contact and
                  follow-up are the broker's two writable fields besides the
                  stage above. Matches the admin row's layout deliberately, so
                  the same lead reads the same way to both people. */}
              <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3 text-[11px] font-light text-brand-muted">
                <span>
                  <span className="text-[10px] uppercase tracking-[0.15em]">Source</span>{" "}
                  <span className="text-brand-black">{sourceLabel(l.lead_source)}</span>
                </span>

                <span>
                  <span className="text-[10px] uppercase tracking-[0.15em]">Assigned</span>{" "}
                  <span className="text-brand-black">{formatDate(l.assigned_at)}</span>
                </span>

                <span className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-[0.15em]">Contacted</span>
                  <span className="text-brand-black">{formatDateTime(l.contacted_at)}</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateLead(l.id, {
                        // Ignored by the server, which stamps its own time —
                        // sent only so the optimistic render shows a date.
                        contacted_at: l.contacted_at
                          ? null
                          : new Date().toISOString(),
                      })
                    }
                    className="text-[10px] uppercase tracking-[0.15em] text-brand-gold hover:text-brand-gold/70 transition-colors"
                  >
                    {l.contacted_at ? "Clear" : "Mark contacted"}
                  </button>
                </span>

                <span className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-[0.15em]">Follow-up</span>
                  <input
                    type="date"
                    value={toDateInputValue(l.next_action_at)}
                    onChange={(e) =>
                      updateLead(l.id, { next_action_at: e.target.value || null })
                    }
                    className={`bg-transparent border-b outline-none py-0.5 transition-colors duration-300 focus:border-brand-gold ${
                      isFollowUpDue(l.next_action_at, nowMs)
                        ? "border-brand-gold text-brand-gold"
                        : "border-brand-border text-brand-black"
                    }`}
                  />
                </span>
              </div>

              {reqExpandedId === l.id && (
                <div className="mt-5 pl-0 md:pl-4 border-l-0 md:border-l border-brand-border">
                  <LeadRequirementsPanel
                    key={l.id}
                    values={l}
                    onSave={(patch) => handleSaveRequirements(l.id, patch)}
                    saving={savingReq}
                    error={reqError}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
