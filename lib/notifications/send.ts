// Internal notification sender.
//
// One place, one rule: THIS FUNCTION NEVER THROWS.
//
// Every caller in this codebase sends a notification *after* a database write
// that has already succeeded — a lead was created, a lead was assigned, a
// reminder is due. A notification failure must never undo or appear to undo
// that write, so the only safe contract is a function that reports failure as
// a value rather than an exception.
//
// Inlining `try { resend.emails.send() } catch {}` at each call site is how
// that rule gets broken: four copies means four chances to forget the catch,
// or to let an env-var assertion throw outside it. Centralising it makes the
// guarantee structural.
//
// Mirrors the existing pattern in app/api/leads/route.ts: env vars asserted
// inside the guarded block, no credential or PII in any log line, and failures
// logged as a stage name plus a message only.

import "server-only";
import { Resend } from "resend";

export type SendResult = { ok: boolean };

/**
 * Escapes values interpolated into an email body.
 *
 * Duplicated from app/api/leads/route.ts rather than extracted from it: that
 * file is out of scope for refactoring here, and the two copies are six
 * identical lines. Escaping is an HTML-rendering concern only — nothing stored
 * in Supabase is ever escaped.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Sends one email and returns whether it succeeded.
 *
 * `to` must be an address resolved from our own records — never one taken from
 * a request body. See lib/notifications/recipients.ts.
 *
 * `stage` is a short label used only for logging, so a failure can be located
 * without printing the recipient, the subject or the body.
 */
export async function sendInternalEmail({
  to,
  subject,
  html,
  stage,
}: {
  to: string;
  subject: string;
  html: string;
  stage: string;
}): Promise<SendResult> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;

    // Asserted INSIDE the try so a missing variable degrades to "not sent"
    // rather than throwing into the caller.
    if (!apiKey) throw new Error("Missing RESEND_API_KEY");
    if (!from) throw new Error("Missing RESEND_FROM_EMAIL");
    if (!to) throw new Error("No recipient resolved");

    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({ from, to, subject, html });

    if (error) {
      // Resend returns errors as a value rather than throwing. Only the stage
      // and the provider's message are logged — never the recipient.
      console.error("notify_error", stage, error.message ?? "send failed");
      return { ok: false };
    }

    console.log("notify_sent", stage);
    return { ok: true };
  } catch (err) {
    console.error(
      "notify_error",
      stage,
      err instanceof Error ? err.message : "unknown error"
    );
    return { ok: false };
  }
}

/** Absolute base URL for CRM links in emails. Matches the fallback used by the 7 existing callers of this variable. */
export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://pinnaclproperties.com";
}
