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

  async function updateLead(id: string, patch: Record<string, unknown>) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    await fetch(`/api/admin/leads/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
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
