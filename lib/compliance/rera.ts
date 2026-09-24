// MahaRERA disclosure support for public marketing surfaces.
//
// WHY THIS EXISTS
// MahaRERA Order No. 46C/2025 (No. MahaRERA/Secy/File No. 27/246/2025,
// dated 08.04.2025) directs "all promoters and registered real estate
// agents" on how the MahaRERA registration number, the Authority's website
// address and the project QR code must appear in advertisements. The order
// records that Rule 14(2) of the Maharashtra RERA Rules 2017, prescribed
// under Section 10(e) of the Act, "mandates every registered real estate
// agent to quote the agent registration number as well as the project
// registration number in every advertisement issued."
//
// The media the order enumerates include "websites or webpages of projects"
// and "social media advertisements", so this site's public listing pages are
// in scope on the face of the order.
//
// WHAT THIS FILE DOES AND DOES NOT DO
// It centralises (a) where the agent registration number comes from and
// (b) what may honestly be said about a property given the data we hold.
// It does NOT assert compliance, and it deliberately does not implement the
// QR/placement rules — see the TODOs below, which are open interpretation
// questions, not engineering gaps.
//
// Nothing here hardcodes a registration number. If the environment variable
// is unset, every disclosure surface renders nothing rather than a guess.

// ---------------------------------------------------------------------------
// OPEN QUESTIONS — REQUIRES MAHARERA CONFIRMATION / REQUIRES LAWYER
// Do not resolve these in code by guessing. Each changes what must render.
//
// TODO(maharera-1): Order 46C/2025 (b) and (c) require the registration
//   number, website address and QR code to sit in the "top-right quadrant",
//   and (a) requires the registration-number font to be "equal to or larger
//   than" the largest font used for contact details and address. Those rules
//   are drafted for a fixed-canvas advertisement. A responsive web page has
//   no stable quadrant and reflows across breakpoints. How the rule applies
//   to a responsive page is UNRESOLVED. Placement here is therefore a
//   presentational choice only and must not be read as a compliance claim.
//
// TODO(maharera-2): Whether an agent-operated listing page must carry the
//   *project* QR code, or whether the QR obligation attaches to the promoter
//   (Section 11(2) speaks to promoter advertisements), is UNRESOLVED. No QR
//   is rendered until this is answered.
//
// TODO(maharera-3): The order enumerates specific media and adds "any other
//   advertisements / promotions". Whether that catch-all captures WhatsApp
//   broadcast and YouTube is UNRESOLVED.
//
// TODO(maharera-4): No programmatic means of verifying a registration number
//   against MahaRERA, or of checking the deregistered / lapsed-validity
//   lists, has been identified. Verification is therefore a manual,
//   human-recorded act. `reraVerification` below models that honestly and
//   currently always reports "not verified", because the database has no
//   field in which a human verification could be recorded. Adding that field
//   is Stage 1 work and is deliberately out of scope here.
// ---------------------------------------------------------------------------

/**
 * Pinnacl's own MahaRERA real estate agent registration number.
 * Supplied by environment only — never hardcoded, never inferred.
 * Unset => every disclosure surface omits the agent line entirely.
 */
export const AGENT_RERA_NUMBER =
  process.env.NEXT_PUBLIC_MAHARERA_AGENT_REG_NO?.trim() || null;

/** The Authority's website address, as referenced by Order 46C/2025. */
export const MAHARERA_WEBSITE = "https://maharera.maharashtra.gov.in";

/**
 * A project registration number we hold is a *recorded* value. It is not, on
 * its own, evidence that the registration exists, is current, or covers this
 * property. `properties.rera_number` is free text with no validation and has
 * in practice contained placeholder values.
 *
 * Callers must therefore never turn a non-null number into a claim such as
 * "RERA verified". Use `describeProjectRegistration` for display text.
 */
export type ReraVerification = {
  /** A number is recorded against the property. */
  hasRecordedNumber: boolean;
  /** The recorded number, trimmed. Null when absent or blank. */
  recordedNumber: string | null;
  /**
   * Whether a human has verified the number against MahaRERA.
   * Always false today: no column exists to record such a verification.
   * See TODO(maharera-4).
   */
  humanVerified: false;
};

export function reraVerification(reraNumber?: string | null): ReraVerification {
  const recordedNumber = reraNumber?.trim() || null;
  return {
    hasRecordedNumber: recordedNumber !== null,
    recordedNumber,
    humanVerified: false,
  };
}

/**
 * The only sentence we are entitled to publish about a project's
 * registration, given the data we actually hold.
 *
 * Returns null when no number is recorded — in which case the caller must
 * render nothing at all, not a softer claim. Saying "registration pending"
 * or similar would itself be an unsupported assertion.
 */
export function describeProjectRegistration(
  reraNumber?: string | null
): string | null {
  const { recordedNumber } = reraVerification(reraNumber);
  if (!recordedNumber) return null;
  return `MahaRERA registration number as provided for this project: ${recordedNumber}`;
}

/**
 * Claims that must never be rendered unless a specific, recorded piece of
 * evidence supports them for the individual property. Exported so a future
 * publication gate (Stage 1) can scan admin-entered copy for them, and so
 * this list has one home rather than living in reviewers' heads.
 *
 * "RERA verified" is on the list deliberately: holding a number is not
 * verification, and the system currently cannot record verification at all.
 */
export const PROHIBITED_UNSUPPORTED_CLAIMS: readonly string[] = [
  "rera verified",
  "rera-verified",
  "verified listing",
  "verified project",
  "legally approved",
  "legal clarity",
  "clear title",
  "documentation reviewed",
  "guaranteed return",
  "assured return",
  "assured appreciation",
  "guaranteed appreciation",
  "best investment",
  "risk free",
  "risk-free",
];

/** Case-insensitive scan used by tests and (later) the publication gate. */
export function findProhibitedClaims(text: string): string[] {
  const haystack = text.toLowerCase();
  return PROHIBITED_UNSUPPORTED_CLAIMS.filter((claim) =>
    haystack.includes(claim)
  );
}
