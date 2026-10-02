"use client";

import { useMemo, useState } from "react";
import { LEAD_SOURCES, LEAD_SOURCE_LABELS } from "@/lib/supabase/types";
import {
  formatDate,
  formatDateTime,
  isFollowUpDue,
  toDateInputValue,
} from "@/lib/leads/leadDisplay";

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
  created_at: string;
  deleted_at: string | null;
};

type Broker = { id: string; full_name: string | null };
type PropertyOption = { id: string; title: string };
type Note = { id: string; note: string; author_id: string; created_at: string };
type SiteVisit = {
  id: string;
  lead_id: string;
  property_id: string;
  broker_id: string;
  visit_date: string;
  notes: string | null;
  created_at: string;
};

const EMPTY_VISIT_DRAFT = { property_id: "", visit_date: "", notes: "" };

const STAGES: { value: string; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "site_visit", label: "Site Visit" },
  { value: "negotiation", label: "Negotiation" },
  { value: "closed", label: "Closed" },
  { value: "lost", label: "Lost" },
];

const EMPTY_NEW_LEAD = {
  buyer_name: "",
  buyer_phone: "",
  buyer_email: "",
  message: "",
  property_id: "",
  assigned_broker_id: "",
  // Starts blank and the field is `required`, so the admin has to make a
  // deliberate choice. It is not pre-filled with a plausible-looking default:
  // a guessed channel is worse than no channel, because it looks like data.
  lead_source: "",
};

export default function LeadsAdminClient({
  initialLeads,
  brokers,
  properties,
}: {
  initialLeads: Lead[];
  brokers: Broker[];
  properties: PropertyOption[];
}) {
  const [leads, setLeads] = useState(initialLeads);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [newLead, setNewLead] = useState(EMPTY_NEW_LEAD);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notesByLead, setNotesByLead] = useState<Record<string, Note[]>>({});
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  // Site visits mirror the notes panel exactly: its own expanded row, its own
  // lazily-fetched cache, its own draft. Kept separate from `expandedId` so
  // opening visits does not close notes and vice versa.
  const [visitsExpandedId, setVisitsExpandedId] = useState<string | null>(null);
  const [visitsByLead, setVisitsByLead] = useState<Record<string, SiteVisit[]>>({});
  const [visitDraft, setVisitDraft] = useState(EMPTY_VISIT_DRAFT);
  const [savingVisit, setSavingVisit] = useState(false);
  const [visitError, setVisitError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [view, setView] = useState<"active" | "archived">("active");
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [attentionOnly, setAttentionOnly] = useState(false);

  // "Now" is sampled ONCE, via a lazy state initializer, rather than read
  // during every render. Reading the clock inline would give each re-render a
  // different answer and could flip a follow-up's styling mid-interaction;
  // holding it in state keeps the row stable for the life of the page.
  const [nowMs] = useState(() => Date.now());

  // Counts are derived per view and never mixed: the Active tab counts only
  // live rows, the Archived tab only archived ones.
  const activeCount = useMemo(
    () => leads.filter((l) => !l.deleted_at).length,
    [leads]
  );
  const archivedCount = useMemo(
    () => leads.filter((l) => l.deleted_at).length,
    [leads]
  );

  // The three states that mean a lead is waiting on someone. Deliberately
  // derived, not stored: there is no "needs attention" column to keep in sync,
  // and the rule can change without a migration.
  const attentionFlags = useMemo(() => {
    const flags = new Map<string, string[]>();
    for (const l of leads) {
      const reasons: string[] = [];
      if (!l.assigned_broker_id) reasons.push("Unassigned");
      if (!l.contacted_at) reasons.push("Not contacted");
      if (isFollowUpDue(l.next_action_at, nowMs)) reasons.push("Follow-up due");
      if (reasons.length > 0) flags.set(l.id, reasons);
    }
    return flags;
  }, [leads, nowMs]);

  const attentionCount = useMemo(
    () => leads.filter((l) => !l.deleted_at && attentionFlags.has(l.id)).length,
    [leads, attentionFlags]
  );

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      // The view gate runs first: an archived lead can never appear in the
      // Active list, whatever the search or stage filter says.
      const matchesView = view === "archived" ? !!l.deleted_at : !l.deleted_at;
      if (!matchesView) return false;

      const matchesSearch =
        !search ||
        l.buyer_name.toLowerCase().includes(search.toLowerCase()) ||
        (l.buyer_phone ?? "").includes(search);
      const matchesStage = !stageFilter || l.status === stageFilter;
      const matchesAttention = !attentionOnly || attentionFlags.has(l.id);
      return matchesSearch && matchesStage && matchesAttention;
    });
  }, [leads, search, stageFilter, view, attentionOnly, attentionFlags]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(newLead),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setCreateError(data.error || "Could not create lead");
        setCreating(false);
        return;
      }
      const refreshed = await fetch("/api/admin/leads");
      const refreshedData = await refreshed.json();
      if (refreshed.ok) setLeads(refreshedData.leads ?? []);
      setNewLead(EMPTY_NEW_LEAD);
      setFormOpen(false);
    } finally {
      setCreating(false);
    }
  }

  // Optimistic update with rollback.
  //
  // Previously the response was discarded entirely, so a 400, 403 or 500 left
  // the UI showing a stage or assignment the database never accepted — an
  // admin could believe a lead was assigned when it was not.
  //
  // The whole previous lead row is captured before mutating, and restored
  // verbatim on any non-2xx or network failure, so the UI ends up matching
  // the database rather than a guess. Restoring the captured row (not just
  // the patched keys) also avoids leaving a half-applied multi-key patch.
  // No refetch is needed: rollback is sufficient to reach server truth.
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
      const res = await fetch(`/api/admin/leads/${id}`, {
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

  // Archive / restore. Both are soft: the row is never deleted, every field is
  // preserved, and only `deleted_at` moves. The server generates the archive
  // timestamp — the client sends intent, not a value.
  //
  // Server-confirmed, not optimistic: the list only changes after a 2xx, so a
  // rejected archive never removes a lead from the admin's view. On failure
  // the list is untouched and a generic error is shown.
  async function setArchived(id: string, archived: boolean) {
    setSaveError("");
    setArchivingId(id);
    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          deleted_at: archived ? new Date().toISOString() : null,
        }),
      });

      if (!res.ok) {
        setSaveError(
          archived
            ? "Could not archive this lead. Please try again."
            : "Could not restore this lead. Please try again."
        );
        return;
      }

      // Mirror the server's own rule locally: archived rows carry a
      // timestamp, restored rows carry null. The exact value is cosmetic —
      // only null vs non-null decides which view a lead appears in.
      setLeads((prev) =>
        prev.map((l) =>
          l.id === id
            ? { ...l, deleted_at: archived ? new Date().toISOString() : null }
            : l
        )
      );
      setConfirmArchiveId(null);
      setConfirmRestoreId(null);
    } catch {
      setSaveError(
        archived
          ? "Could not archive this lead. Please try again."
          : "Could not restore this lead. Please try again."
      );
    } finally {
      setArchivingId(null);
    }
  }

  async function toggleNotes(leadId: string) {
    if (expandedId === leadId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(leadId);
    if (!notesByLead[leadId]) {
      const res = await fetch(`/api/admin/leads/${leadId}/notes`);
      const data = await res.json();
      if (res.ok) {
        setNotesByLead((prev) => ({ ...prev, [leadId]: data.notes ?? [] }));
      }
    }
  }

  // Resolves a property id to its title using the list this component already
  // receives. The API returns property_id rather than an embedded
  // properties(title), because the hand-written Database type declares
  // `Relationships: []` and PostgREST embed inference collapses to `never`.
  function propertyTitle(propertyId: string): string {
    return properties.find((p) => p.id === propertyId)?.title ?? "Unknown property";
  }

  async function toggleSiteVisits(leadId: string) {
    if (visitsExpandedId === leadId) {
      setVisitsExpandedId(null);
      return;
    }
    setVisitsExpandedId(leadId);
    setVisitError("");
    setVisitDraft(EMPTY_VISIT_DRAFT);
    if (!visitsByLead[leadId]) {
      const res = await fetch(`/api/admin/site-visits?lead_id=${encodeURIComponent(leadId)}`);
      const data = await res.json();
      if (res.ok) {
        setVisitsByLead((prev) => ({ ...prev, [leadId]: data.siteVisits ?? [] }));
      } else {
        setVisitError("Could not load site visits.");
      }
    }
  }

  // Server-confirmed, not optimistic: a site visit is immutable once written
  // (site_visits has no UPDATE or DELETE policy for any role), so showing one
  // that the database rejected would be showing history that does not exist
  // and cannot be undone. The list only changes after a 2xx.
  async function handleAddSiteVisit(leadId: string) {
    if (!visitDraft.property_id || !visitDraft.visit_date) {
      setVisitError("Property and visit date are both required.");
      return;
    }

    setSavingVisit(true);
    setVisitError("");
    try {
      const res = await fetch("/api/admin/site-visits", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          lead_id: leadId,
          property_id: visitDraft.property_id,
          // Sent as the browser's local datetime string; the server parses it
          // and stores the normalised ISO value. broker_id is NOT sent — the
          // route derives it from the session.
          visit_date: visitDraft.visit_date,
          notes: visitDraft.notes,
        }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setVisitError(data?.error || "Could not record this site visit.");
        return;
      }

      const refreshed = await fetch(
        `/api/admin/site-visits?lead_id=${encodeURIComponent(leadId)}`
      );
      const refreshedData = await refreshed.json();
      if (refreshed.ok) {
        setVisitsByLead((prev) => ({ ...prev, [leadId]: refreshedData.siteVisits ?? [] }));
      }
      setVisitDraft(EMPTY_VISIT_DRAFT);
    } catch {
      setVisitError("Could not record this site visit.");
    } finally {
      setSavingVisit(false);
    }
  }

  async function handleAddNote(leadId: string) {
    if (!noteDraft.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/notes`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ note: noteDraft.trim() }),
      });
      if (res.ok) {
        const refreshed = await fetch(`/api/admin/leads/${leadId}/notes`);
        const data = await refreshed.json();
        if (refreshed.ok) setNotesByLead((prev) => ({ ...prev, [leadId]: data.notes ?? [] }));
        setNoteDraft("");
      }
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <div>
      {/* Active / Archived view toggle. Uses the same gold-underline
          treatment as other in-content navigation; Active is the default. */}
      <div className="flex items-center gap-8 mb-8 border-b border-brand-border">
        {([
          { key: "active" as const, label: "Active Leads", count: activeCount },
          { key: "archived" as const, label: "Archived", count: archivedCount },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setView(tab.key);
              setConfirmArchiveId(null);
              setConfirmRestoreId(null);
              setSaveError("");
              // "Needs attention" only applies to live leads; carrying it
              // into the Archived view would silently hide archived rows.
              setAttentionOnly(false);
            }}
            className={`-mb-px border-b pb-3 text-xs uppercase tracking-[0.15em] font-light transition-colors duration-300 ${
              view === tab.key
                ? "border-brand-gold text-brand-black"
                : "border-transparent text-brand-muted hover:text-brand-black"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-10">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
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
          {/* A filter, not a dashboard: it narrows the existing list to the
              leads waiting on someone, using the same rule the per-row flags
              show. Hidden in the Archived view, where "needs attention" is
              meaningless. */}
          {view === "active" && (
            <button
              type="button"
              onClick={() => setAttentionOnly((v) => !v)}
              className={`text-xs uppercase tracking-[0.15em] font-light whitespace-nowrap transition-colors duration-300 ${
                attentionOnly
                  ? "text-brand-gold"
                  : "text-brand-muted hover:text-brand-black"
              }`}
            >
              Needs attention ({attentionCount})
            </button>
          )}
        </div>
        <button
          onClick={() => setFormOpen((v) => !v)}
          className="btn-gold-outline whitespace-nowrap"
        >
          {formOpen ? "Cancel" : "Create Lead"}
        </button>
      </div>

      {formOpen && (
        <form
          onSubmit={handleCreate}
          className="border border-brand-border bg-white p-6 md:p-10 mb-16 grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <input
            required
            value={newLead.buyer_name}
            onChange={(e) => setNewLead((p) => ({ ...p, buyer_name: e.target.value }))}
            placeholder="Buyer Name"
            className="input-light"
          />
          <input
            value={newLead.buyer_phone}
            onChange={(e) => setNewLead((p) => ({ ...p, buyer_phone: e.target.value }))}
            placeholder="Phone"
            className="input-light"
          />
          <input
            value={newLead.buyer_email}
            onChange={(e) => setNewLead((p) => ({ ...p, buyer_email: e.target.value }))}
            placeholder="Email"
            className="input-light"
          />
          <select
            value={newLead.property_id}
            onChange={(e) => setNewLead((p) => ({ ...p, property_id: e.target.value }))}
            className="input-light"
          >
            <option value="">No property linked</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          {/* The single most important field on this form. A WhatsApp
              enquiry, a referral or a walk-in never touches /api/leads, so
              this is the only place their real origin is ever recorded. */}
          <select
            required
            value={newLead.lead_source}
            onChange={(e) => setNewLead((p) => ({ ...p, lead_source: e.target.value }))}
            className="input-light"
          >
            <option value="">Where did this lead come from?</option>
            {LEAD_SOURCES.map((s) => (
              <option key={s} value={s}>
                {LEAD_SOURCE_LABELS[s]}
              </option>
            ))}
          </select>
          <select
            value={newLead.assigned_broker_id}
            onChange={(e) => setNewLead((p) => ({ ...p, assigned_broker_id: e.target.value }))}
            className="input-light"
          >
            <option value="">Unassigned</option>
            {brokers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.full_name || "Unnamed Broker"}
              </option>
            ))}
          </select>
          <textarea
            value={newLead.message}
            onChange={(e) => setNewLead((p) => ({ ...p, message: e.target.value }))}
            placeholder="Message / requirement"
            rows={3}
            className="input-light resize-none md:col-span-2"
          />
          {createError && (
            <p className="text-xs text-red-700/80 font-light md:col-span-2">{createError}</p>
          )}
          <button type="submit" disabled={creating} className="btn-gold-outline md:col-span-2">
            {creating ? "Creating…" : "Save Lead"}
          </button>
        </form>
      )}

      {saveError && (
        <p className="mb-4 text-xs font-light text-red-700/80">{saveError}</p>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm font-light text-brand-muted">No leads found.</p>
      ) : (
        <div className="divide-y divide-brand-border border-t border-b border-brand-border">
          {filtered.map((l) => (
            <div key={l.id} className="py-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-brand-black">{l.buyer_name}</p>
                  <p className="text-xs font-light text-brand-muted mt-0.5">
                    {[l.buyer_phone, l.buyer_email].filter(Boolean).join(" · ") || "—"}
                  </p>
                  {/* Attention flags. Restrained on purpose — a thin gold
                      line of text, not a coloured pill or a badge. Hidden on
                      archived rows, where none of it is actionable. */}
                  {view === "active" && attentionFlags.has(l.id) && (
                    <p className="text-[10px] uppercase tracking-[0.15em] font-light text-brand-gold mt-1.5">
                      {attentionFlags.get(l.id)!.join(" · ")}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4">
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

                  <select
                    value={l.assigned_broker_id ?? ""}
                    onChange={(e) =>
                      updateLead(l.id, { assigned_broker_id: e.target.value || null })
                    }
                    className="input-light text-xs py-2"
                  >
                    <option value="">Unassigned</option>
                    {brokers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.full_name || "Unnamed Broker"}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => toggleNotes(l.id)}
                    className="text-xs uppercase tracking-[0.15em] font-light text-brand-gold hover:text-brand-gold/70 transition-colors"
                  >
                    {expandedId === l.id ? "Hide Notes" : "Notes"}
                  </button>

                  <button
                    onClick={() => toggleSiteVisits(l.id)}
                    className="text-xs uppercase tracking-[0.15em] font-light text-brand-gold hover:text-brand-gold/70 transition-colors"
                  >
                    {visitsExpandedId === l.id ? "Hide Visits" : "Site Visits"}
                  </button>

                  {/* Archive / Restore with an inline confirm step, matching
                      the pattern already used for property soft-delete. */}
                  {view === "active" ? (
                    confirmArchiveId === l.id ? (
                      <span className="flex items-center gap-3 text-xs uppercase tracking-[0.15em] font-light">
                        <span className="text-brand-muted normal-case tracking-normal">
                          Archive this lead?
                        </span>
                        <button
                          onClick={() => setConfirmArchiveId(null)}
                          className="text-brand-muted hover:text-brand-black transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => setArchived(l.id, true)}
                          disabled={archivingId === l.id}
                          className="text-red-700 hover:text-red-700/70 transition-colors disabled:opacity-50"
                        >
                          {archivingId === l.id ? "Archiving…" : "Archive"}
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setConfirmArchiveId(l.id)}
                        className="text-xs uppercase tracking-[0.15em] font-light text-brand-muted hover:text-brand-black transition-colors"
                      >
                        Archive
                      </button>
                    )
                  ) : confirmRestoreId === l.id ? (
                    <span className="flex items-center gap-3 text-xs uppercase tracking-[0.15em] font-light">
                      <span className="text-brand-muted normal-case tracking-normal">
                        Restore this lead?
                      </span>
                      <button
                        onClick={() => setConfirmRestoreId(null)}
                        className="text-brand-muted hover:text-brand-black transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => setArchived(l.id, false)}
                        disabled={archivingId === l.id}
                        className="text-brand-gold hover:text-brand-gold/70 transition-colors disabled:opacity-50"
                      >
                        {archivingId === l.id ? "Restoring…" : "Restore"}
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmRestoreId(l.id)}
                      className="text-xs uppercase tracking-[0.15em] font-light text-brand-gold hover:text-brand-gold/70 transition-colors"
                    >
                      Restore
                    </button>
                  )}
                </div>
              </div>

              {/* P1 tracking row — source, assignment time, contact, follow-up.
                  Kept to one quiet line of small text so the list still reads
                  as a list rather than a dashboard. */}
              <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3 text-[11px] font-light text-brand-muted">
                <span className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-[0.15em]">Source</span>
                  {/* Editable: the admin is the only person who can correct a
                      channel that was logged wrong, or fill one in on a lead
                      that predates this field. */}
                  <select
                    value={l.lead_source ?? ""}
                    onChange={(e) =>
                      updateLead(l.id, { lead_source: e.target.value || null })
                    }
                    className="bg-transparent text-brand-black border-b border-brand-border focus:border-brand-gold outline-none py-0.5 transition-colors duration-300"
                  >
                    <option value="">Not recorded</option>
                    {LEAD_SOURCES.map((s) => (
                      <option key={s} value={s}>
                        {LEAD_SOURCE_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </span>

                <span>
                  <span className="text-[10px] uppercase tracking-[0.15em]">Assigned</span>{" "}
                  {/* Read-only everywhere: assigned_at is written by the
                      leads_assignment_timestamp trigger from
                      assigned_broker_id, never by this UI. */}
                  <span className="text-brand-black">
                    {l.assigned_broker_id ? formatDate(l.assigned_at) : "—"}
                  </span>
                </span>

                <span className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-[0.15em]">Contacted</span>
                  <span className="text-brand-black">{formatDateTime(l.contacted_at)}</span>
                  {/* Sends intent, not a timestamp — the server stamps it.
                      Separate from the stage dropdown on purpose: the stage is
                      a label someone chose, this is a record that contact
                      actually happened. */}
                  <button
                    type="button"
                    onClick={() =>
                      updateLead(l.id, {
                        // The value is ignored by the server, which generates
                        // its own timestamp — it is sent so the optimistic
                        // render has a real date to display rather than a
                        // placeholder. Same arrangement as archive below.
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

              {/* Site visits. Append-only: recorded visits are listed, never
                  edited or removed, because the table grants no UPDATE or
                  DELETE to any role. */}
              {visitsExpandedId === l.id && (
                <div className="mt-5 pl-0 md:pl-4 border-l-0 md:border-l border-brand-border">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-brand-muted mb-3">
                    Site Visits
                  </p>

                  <div className="space-y-3 mb-5">
                    {(visitsByLead[l.id] ?? []).length === 0 ? (
                      <p className="text-xs font-light text-brand-muted">
                        No site visits recorded.
                      </p>
                    ) : (
                      visitsByLead[l.id].map((v) => (
                        <div key={v.id} className="text-xs font-light">
                          <p className="text-brand-black">
                            {propertyTitle(v.property_id)}
                          </p>
                          <p className="text-brand-muted mt-0.5">
                            {formatDateTime(v.visit_date)}
                          </p>
                          {v.notes && (
                            <p className="text-brand-black mt-1 leading-relaxed">{v.notes}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      value={visitDraft.property_id}
                      onChange={(e) =>
                        setVisitDraft((p) => ({ ...p, property_id: e.target.value }))
                      }
                      className="input-light text-sm sm:max-w-[220px]"
                    >
                      <option value="">Property visited</option>
                      {properties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                    <input
                      type="datetime-local"
                      value={visitDraft.visit_date}
                      onChange={(e) =>
                        setVisitDraft((p) => ({ ...p, visit_date: e.target.value }))
                      }
                      className="input-light text-sm sm:max-w-[200px]"
                    />
                    <input
                      value={visitDraft.notes}
                      onChange={(e) => setVisitDraft((p) => ({ ...p, notes: e.target.value }))}
                      placeholder="Visit notes (optional)"
                      className="input-light text-sm flex-1"
                    />
                    <button
                      onClick={() => handleAddSiteVisit(l.id)}
                      disabled={savingVisit}
                      className="text-xs uppercase tracking-[0.15em] font-light text-brand-gold hover:text-brand-gold/70 transition-colors whitespace-nowrap disabled:opacity-50"
                    >
                      {savingVisit ? "Saving…" : "Record Visit"}
                    </button>
                  </div>

                  {visitError && (
                    <p className="mt-3 text-xs font-light text-red-700/80">{visitError}</p>
                  )}
                </div>
              )}

              {expandedId === l.id && (
                <div className="mt-5 pl-0 md:pl-4 border-l-0 md:border-l border-brand-border">
                  <div className="space-y-3 mb-4">
                    {(notesByLead[l.id] ?? []).length === 0 ? (
                      <p className="text-xs font-light text-brand-muted">No notes yet.</p>
                    ) : (
                      notesByLead[l.id].map((n) => (
                        <div key={n.id} className="text-xs font-light">
                          <p className="text-brand-black">{n.note}</p>
                          <p className="text-brand-muted mt-0.5">
                            {new Date(n.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-3">
                    <input
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      placeholder="Add a follow-up note"
                      className="input-light text-sm flex-1"
                    />
                    <button
                      onClick={() => handleAddNote(l.id)}
                      disabled={savingNote}
                      className="text-xs uppercase tracking-[0.15em] font-light text-brand-gold hover:text-brand-gold/70 transition-colors whitespace-nowrap"
                    >
                      {savingNote ? "Saving…" : "Add Note"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] uppercase tracking-[0.15em] text-brand-muted mt-6">
        {leads.length} lead{leads.length === 1 ? "" : "s"} total
      </p>
    </div>
  );
}
