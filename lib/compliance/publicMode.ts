// Pre-registration public mode.
//
// WHY THIS EXISTS
// MahaRERA's official guidance for agents states that "Every real estate
// agent need to take prior registration with RERA authority of Maharashtra
// before dealing in any transactions relating to sale/purchase, advertising
// or brokerage", and lists among an agent's obligations to "prevent
// unapproved advertisements".
// Source: https://maharera.maharashtra.gov.in/guidance-for-agents-detail
//
// Pinnacl's competency/examination requirement has been completed, but the
// agent registration number has NOT yet been issued. Until it is, the owner
// has chosen to stop the public site from operating as an active property
// marketing and facilitation surface. This module implements that choice.
//
// This is a cautious operating posture selected by the owner. It is NOT a
// legal opinion, and nothing here asserts what the law requires of an
// applicant awaiting issuance. Whether any particular pre-registration
// activity is permitted — REQUIRES LAWYER.
//
// WHAT IS RESTRICTED (public only)
//   /properties                 -> holding notice, no inventory
//   /properties/[slug]          -> 404, no property detail, no metadata
//   /locations/[location]       -> no property marketing metadata
//   sitemap.xml                 -> no property URLs
//   homepage featured inventory -> suppressed
//   homepage property search    -> suppressed
//   "Collections" nav item      -> hidden
//
// WHAT IS NOT TOUCHED
// Admin CMS, approval workflow, property images, CRM, broker surfaces, RLS,
// audit, and the database. Inventory is never deleted or modified — it is
// simply not advertised publicly. Corporate pages (home brand content,
// /about, /contact) remain available.
//
// ---------------------------------------------------------------------------
// FAIL-CLOSED SEMANTICS — read before changing
//
// Public property surfaces are enabled ONLY when the real agent registration
// number is configured. The override flag can force restriction ON; it can
// NEVER force it OFF.
//
//   NEXT_PUBLIC_MAHARERA_AGENT_REG_NO unset  -> RESTRICTED (always)
//   ...=true                                 -> RESTRICTED (forced)
//   number set, override unset/false         -> enabled
//
// Setting NEXT_PUBLIC_PRE_REGISTRATION_PUBLIC_MODE=false while no
// registration number is configured is deliberately powerless. If it could
// open the site, a single mistyped env var would publish inventory while
// unregistered — the exact failure this module exists to prevent.
//
// Enabling these surfaces is necessary but NOT sufficient for anything to
// appear publicly: the existing publication gates still apply independently
// (approval_status = 'approved' AND deleted_at IS NULL, enforced explicitly
// on every public query). Restoring the number republishes nothing that was
// not already approved.
//
// The override is NEXT_PUBLIC_-prefixed because client components (Hero,
// Navbar) must evaluate it; a server-only variable is undefined in the
// browser bundle and would silently read as "not restricted" there.
// ---------------------------------------------------------------------------

import { AGENT_RERA_NUMBER } from "./rera";

/** True when Pinnacl's real MahaRERA agent registration number is configured. */
export const AGENT_REGISTRATION_CONFIGURED = AGENT_RERA_NUMBER !== null;

/** Explicit override. Only ever tightens; "false" is intentionally a no-op. */
const FORCE_PRE_REGISTRATION_MODE =
  process.env.NEXT_PUBLIC_PRE_REGISTRATION_PUBLIC_MODE === "true";

/**
 * True while the public site must not act as a property marketing or
 * facilitation surface.
 */
export const PRE_REGISTRATION_PUBLIC_MODE =
  FORCE_PRE_REGISTRATION_MODE || !AGENT_REGISTRATION_CONFIGURED;

/**
 * Single predicate every public property surface consults.
 * Positive phrasing so call sites read as an allow-check, not a deny-check.
 */
export const publicPropertySurfacesEnabled = (): boolean =>
  !PRE_REGISTRATION_PUBLIC_MODE;

/**
 * Pure form of the same rule, for tests and for reasoning about the future
 * path without mutating any environment file or inventing a number.
 */
export function resolvePreRegistrationMode(input: {
  agentRegistrationNumber?: string | null;
  forceFlag?: string | null;
}): boolean {
  const configured = (input.agentRegistrationNumber?.trim() || null) !== null;
  return input.forceFlag === "true" || !configured;
}

/** Copy shown where inventory would otherwise appear. Makes no legal claim. */
export const PRE_REGISTRATION_NOTICE = {
  heading: "Property listings are temporarily unavailable",
  body:
    "Pinnacl Properties is completing its MahaRERA real estate agent registration. Until that registration number is issued, we are not publishing property listings on this website. We would still be glad to introduce ourselves and answer general questions.",
} as const;
