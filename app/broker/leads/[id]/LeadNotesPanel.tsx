"use client";

import { useState } from "react";

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

export default function LeadNotesPanel({
  leadId,
  initialStatus,
  initialNotes,
}: {
  leadId: string;
  initialStatus: string;
  initialNotes: Note[];
}) {
  const [status, setStatus] = useState(initialStatus);
  const [notes, setNotes] = useState(initialNotes);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [updatingStage, setUpdatingStage] = useState(false);

  async function handleStageChange(next: string) {
    setStatus(next);
    setUpdatingStage(true);
    try {
      await fetch(`/api/broker/leads/${leadId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
    } finally {
      setUpdatingStage(false);
    }
  }

  async function handleAddNote() {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/broker/leads/${leadId}/notes`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ note: draft.trim() }),
      });
      if (res.ok) {
        const refreshed = await fetch(`/api/broker/leads/${leadId}/notes`);
        const data = await refreshed.json();
        if (refreshed.ok) setNotes(data.notes ?? []);
        setDraft("");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-10 pb-10 border-b border-brand-border">
        <p className="text-[10px] uppercase tracking-[0.2em] text-brand-muted mb-2">
          Pipeline Stage
        </p>
        <select
          value={status}
          onChange={(e) => handleStageChange(e.target.value)}
          disabled={updatingStage}
          className="input-light sm:max-w-xs"
        >
          {STAGES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <p className="section-label mb-6">Follow-up Notes</p>

      <div className="space-y-4 mb-8">
        {notes.length === 0 ? (
          <p className="text-sm font-light text-brand-muted">No notes yet.</p>
        ) : (
          notes.map((n) => (
            <div key={n.id} className="border border-brand-border p-4">
              <p className="text-sm font-light text-brand-black">{n.note}</p>
              <p className="text-xs font-light text-brand-muted mt-2">
                {new Date(n.created_at).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a follow-up note…"
          rows={3}
          className="input-light resize-none flex-1"
        />
        <button
          onClick={handleAddNote}
          disabled={saving}
          className="btn-gold-outline whitespace-nowrap self-start"
        >
          {saving ? "Saving…" : "Add Note"}
        </button>
      </div>
    </div>
  );
}
