"use client";

import { useState } from "react";
import {
  LEAD_CONFIGURATIONS,
  LEAD_CONFIGURATION_LABELS,
  LEAD_FINANCING_STATUSES,
  LEAD_FINANCING_STATUS_LABELS,
  LEAD_PURPOSES,
  LEAD_PURPOSE_LABELS,
  LEAD_TIMELINES,
  LEAD_TIMELINE_LABELS,
} from "@/lib/supabase/types";

// Buyer requirement capture, shared by the admin and broker lead lists.
//
// Presentational only: it holds a draft, validates nothing beyond what the
// browser enforces, and hands a patch to the parent. Both callers send that
// patch through their existing optimistic-update helper, so rollback and error
// handling stay exactly as they already are. The server is the real boundary —
// parseRequirementFields in lib/leads/requirementFields.ts, backed by CHECK
// constraints.
//
// One component rather than two copies so the two surfaces cannot drift: a
// broker and the admin must see the same lead described the same way.
//
// NO FIELD IS MANDATORY. A buyer rarely answers all seven on first contact, and
// a half-filled requirement is more useful than a forced guess. Every control
// has a blank option that clears the field back to "not recorded".

export type LeadRequirementValues = {
  budget_min: number | null;
  budget_max: number | null;
  configuration: string | null;
  preferred_locality: string | null;
  purpose: string | null;
  timeline: string | null;
  financing_status: string | null;
};

// Rendered as a plain string so an empty input stays empty rather than
// showing "0" or "null".
function toInputValue(value: number | null): string {
  return value === null || value === undefined ? "" : String(value);
}

export default function LeadRequirementsPanel({
  values,
  onSave,
  saving,
  error,
}: {
  values: LeadRequirementValues;
  onSave: (patch: Record<string, unknown>) => void;
  saving: boolean;
  error: string;
}) {
  const [draft, setDraft] = useState({
    budget_min: toInputValue(values.budget_min),
    budget_max: toInputValue(values.budget_max),
    configuration: values.configuration ?? "",
    preferred_locality: values.preferred_locality ?? "",
    purpose: values.purpose ?? "",
    timeline: values.timeline ?? "",
    financing_status: values.financing_status ?? "",
  });

  function set<K extends keyof typeof draft>(key: K, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    // All seven keys are sent together, every time.
    //
    // The budget pair in particular MUST travel together: the server validates
    // that max >= min only when both bounds are in the same request. Sending
    // one alone would leave leads_budget_range_valid as the only check, and a
    // constraint violation surfaces as a generic 500 rather than a readable
    // message.
    //
    // Empty strings are sent as-is; the server reads "" as an explicit clear.
    onSave({
      budget_min: draft.budget_min,
      budget_max: draft.budget_max,
      configuration: draft.configuration,
      preferred_locality: draft.preferred_locality,
      purpose: draft.purpose,
      timeline: draft.timeline,
      financing_status: draft.financing_status,
    });
  }

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-brand-muted mb-3">
        Buyer Requirement
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <input
          type="number"
          min={0}
          inputMode="numeric"
          value={draft.budget_min}
          onChange={(e) => set("budget_min", e.target.value)}
          placeholder="Budget from (₹)"
          className="input-light text-sm"
        />
        <input
          type="number"
          min={0}
          inputMode="numeric"
          value={draft.budget_max}
          onChange={(e) => set("budget_max", e.target.value)}
          placeholder="Budget to (₹)"
          className="input-light text-sm"
        />

        <select
          value={draft.configuration}
          onChange={(e) => set("configuration", e.target.value)}
          className="input-light text-sm"
        >
          <option value="">Configuration —</option>
          {LEAD_CONFIGURATIONS.map((c) => (
            <option key={c} value={c}>
              {LEAD_CONFIGURATION_LABELS[c]}
            </option>
          ))}
        </select>

        {/* Free text by design — locality names are hyper-local and
            inconsistently spelled, and a buyer often names several. */}
        <input
          value={draft.preferred_locality}
          onChange={(e) => set("preferred_locality", e.target.value)}
          placeholder="Preferred locality"
          className="input-light text-sm"
        />

        <select
          value={draft.purpose}
          onChange={(e) => set("purpose", e.target.value)}
          className="input-light text-sm"
        >
          <option value="">Purpose —</option>
          {LEAD_PURPOSES.map((p) => (
            <option key={p} value={p}>
              {LEAD_PURPOSE_LABELS[p]}
            </option>
          ))}
        </select>

        <select
          value={draft.timeline}
          onChange={(e) => set("timeline", e.target.value)}
          className="input-light text-sm"
        >
          <option value="">Timeline —</option>
          {LEAD_TIMELINES.map((t) => (
            <option key={t} value={t}>
              {LEAD_TIMELINE_LABELS[t]}
            </option>
          ))}
        </select>

        <select
          value={draft.financing_status}
          onChange={(e) => set("financing_status", e.target.value)}
          className="input-light text-sm"
        >
          <option value="">Financing —</option>
          {LEAD_FINANCING_STATUSES.map((f) => (
            <option key={f} value={f}>
              {LEAD_FINANCING_STATUS_LABELS[f]}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="text-xs uppercase tracking-[0.15em] font-light text-brand-gold hover:text-brand-gold/70 transition-colors disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save Requirement"}
      </button>

      {error && <p className="mt-3 text-xs font-light text-red-700/80">{error}</p>}
    </div>
  );
}
