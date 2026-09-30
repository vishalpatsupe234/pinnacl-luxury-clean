// Formatting helpers shared by the admin and broker lead lists.
//
// Both lists show the same four P1 fields (source, assigned, contacted, next
// follow-up) and must render them identically, so the formatting lives here
// once rather than being duplicated and drifting apart. No data access, no
// secrets, no server-only imports — safe on both sides of the boundary.

const DISPLAY_TIME_ZONE = "Asia/Kolkata";
const DISPLAY_LOCALE = "en-IN";

// Locale and time zone are PINNED rather than left to the runtime default.
//
// These lists are server-rendered and then hydrated, and the server (UTC on
// Vercel) and the viewer's browser (IST) would otherwise format the same
// timestamp differently — producing a React hydration mismatch and, worse, a
// date that silently reads a day earlier for late-evening timestamps. Pinning
// to the market the business actually operates in makes both renders agree.
const dateFormatter = new Intl.DateTimeFormat(DISPLAY_LOCALE, {
  timeZone: DISPLAY_TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat(DISPLAY_LOCALE, {
  timeZone: DISPLAY_TIME_ZONE,
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

/** "14 Mar 2026", or an em dash when the timestamp is absent. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return dateFormatter.format(parsed);
}

/** "14 Mar, 4:30 pm", or an em dash when the timestamp is absent. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return dateTimeFormatter.format(parsed);
}

/**
 * Value for an `<input type="date">`, which requires exactly `YYYY-MM-DD`.
 *
 * Uses the pinned display time zone for the same reason as the formatters
 * above: deriving it from the UTC parts would show the previous day for any
 * follow-up stored after 6:30pm IST, so the date the user picked would not be
 * the date the control displays back to them.
 */
export function toDateInputValue(value: string | null | undefined): string {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(parsed);

  // en-CA already yields YYYY-MM-DD, which is exactly the control's format.
  return parts;
}

/**
 * Days elapsed since a timestamp, or null when it is absent/unparseable.
 * `nowMs` is passed in rather than read from the clock here so the caller
 * controls when "now" is sampled — see the hydration note in the clients.
 */
export function daysSince(
  value: string | null | undefined,
  nowMs: number
): number | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.floor((nowMs - parsed.getTime()) / 86_400_000);
}

/**
 * True when a planned follow-up has come due (its time has passed).
 *
 * `nowMs` is a parameter rather than a call to the clock inside this function
 * so that every row in a list is judged against the same instant, sampled
 * once by the caller. A null `nowMs` means "no reference time", and nothing
 * is reported as due.
 */
export function isFollowUpDue(
  value: string | null | undefined,
  nowMs: number | null
): boolean {
  if (!value || nowMs === null) return false;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.getTime() <= nowMs;
}
