"use client";

import { useMemo, useState } from "react";

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
  deleted_at: string | null;
};

type Broker = { id: string; full_name: string | null };
type PropertyOption = { id: string; title: string };
type Note = { id: string; note: string; author_id: string; created_at: string };

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
  const [saveError, setSaveError] = useState("");
  const [view, setView] = useState<"active" | "archived">("active");
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);

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
      return matchesSearch && matchesStage;
    });
  }, [leads, search, stageFilter, view]);

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
