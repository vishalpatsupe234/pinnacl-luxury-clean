// Shared validation for the seven buyer-requirement fields on public.leads.
//
// Both the admin route (app/api/admin/leads/[id]/route.ts) and the broker
// route (app/api/broker/leads/[id]/route.ts) accept these fields, and both
// must validate them identically. That logic lives here once rather than being
// duplicated and drifting apart — the parseNextActionAt helper is already
// duplicated across those two files, and repeating that for seven fields would
// be a genuine maintenance hazard.
//
// No data access, no secrets, no server-only imports.

import {
  isLeadConfiguration,
  isLeadFinancingStatus,
  isLeadPurpose,
  isLeadTimeline,
  type Database,
} from "@/lib/supabase/types";

type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"];

/** Only the requirement keys — never assignment, stage or archive state. */
export type RequirementPatch = Pick<
  LeadUpdate,
  | "budget_min"
  | "budget_max"
  | "configuration"
  | "preferred_locality"
  | "purpose"
  | "timeline"
  | "financing_status"
>;

export type RequirementParseResult =
  | { ok: true; patch: RequirementPatch }
  | { ok: false; error: string };

// Locality is free text in the database by design, so the only limit is here.
const MAX_LOCALITY_LENGTH = 200;

/**
 * Parses one budget bound.
 *
 * Accepts a number or a numeric string, because <input type="number"> yields a
 * string. null and "" both mean "clear this bound" — each bound is
 * independently optional, since a real requirement is frequently one-sided
 * ("under 2 crore"). Rejects NaN, Infinity and negatives; no minimum is
 * imposed, because buyer budgets are approximate.
 */
function parseBudget(value: unknown): { ok: true; value: number | null } | { ok: false } {
  if (value === null || value === "") return { ok: true, value: null };

  const numeric = typeof value === "number" ? value : Number(value);
  if (typeof value !== "number" && typeof value !== "string") return { ok: false };
  if (!Number.isFinite(numeric) || numeric < 0) return { ok: false };

  return { ok: true, value: numeric };
}

/**
 * Builds a validated patch from whichever requirement keys are present in the
 * body. Keys that are absent are left out entirely, so a caller updating one
 * field never blanks the others.
 *
 * Every enumerated field accepts an explicit null (or "") to clear it back to
 * "not recorded", and rejects any value outside its allowlist with a message
 * naming the field. The CHECK constraints in
 * 20261002090000_leads_requirement_capture.sql would reject a bad value anyway,
 * but only as a generic 500 — this returns a clean 400 instead and keeps the
 * constraint name out of the HTTP response.
 */
export function parseRequirementFields(
  body: Record<string, unknown>
): RequirementParseResult {
  const patch: RequirementPatch = {};

  if ("budget_min" in body) {
    const parsed = parseBudget(body.budget_min);
    if (!parsed.ok) return { ok: false, error: "Invalid minimum budget" };
    patch.budget_min = parsed.value;
  }

  if ("budget_max" in body) {
    const parsed = parseBudget(body.budget_max);
    if (!parsed.ok) return { ok: false, error: "Invalid maximum budget" };
    patch.budget_max = parsed.value;
  }

  // Ordering is checked only when BOTH bounds arrive in the same request, which
  // is how the admin and broker UIs send them. If only one bound is sent and it
  // conflicts with the stored value, leads_budget_range_valid is the backstop —
  // reading the existing row here purely for this edge case would cost an extra
  // query on every requirement edit.
  if (
    patch.budget_min !== undefined &&
    patch.budget_max !== undefined &&
    patch.budget_min !== null &&
    patch.budget_max !== null &&
    patch.budget_max < patch.budget_min
  ) {
    return { ok: false, error: "Maximum budget cannot be lower than the minimum" };
  }

  if ("configuration" in body) {
    const value = body.configuration;
    if (value === null || value === "") {
      patch.configuration = null;
    } else if (!isLeadConfiguration(value)) {
      return { ok: false, error: "Invalid configuration" };
    } else {
      patch.configuration = value;
    }
  }

  if ("preferred_locality" in body) {
    const value = body.preferred_locality;
    if (value === null || value === "") {
      patch.preferred_locality = null;
    } else if (typeof value !== "string") {
      return { ok: false, error: "Invalid preferred locality" };
    } else {
      const trimmed = value.trim();
      if (trimmed.length > MAX_LOCALITY_LENGTH) {
        return { ok: false, error: "Preferred locality is too long" };
      }
      patch.preferred_locality = trimmed || null;
    }
  }

  if ("purpose" in body) {
    const value = body.purpose;
    if (value === null || value === "") {
      patch.purpose = null;
    } else if (!isLeadPurpose(value)) {
      return { ok: false, error: "Invalid purpose" };
    } else {
      patch.purpose = value;
    }
  }

  if ("timeline" in body) {
    const value = body.timeline;
    if (value === null || value === "") {
      patch.timeline = null;
    } else if (!isLeadTimeline(value)) {
      return { ok: false, error: "Invalid timeline" };
    } else {
      patch.timeline = value;
    }
  }

  if ("financing_status" in body) {
    const value = body.financing_status;
    if (value === null || value === "") {
      patch.financing_status = null;
    } else if (!isLeadFinancingStatus(value)) {
      return { ok: false, error: "Invalid financing status" };
    } else {
      patch.financing_status = value;
    }
  }

  return { ok: true, patch };
}

/** The column list both lead routes and both lead pages select. */
export const REQUIREMENT_SELECT_COLUMNS =
  "budget_min, budget_max, configuration, preferred_locality, purpose, timeline, financing_status";
