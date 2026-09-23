// app/api/leads/route.ts
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_RANGE = process.env.GOOGLE_SHEET_RANGE || "Sheet1!A:G";
const SERVICE_ACCOUNT_JSON = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL;
const OWNER_NOTIFICATION_EMAIL = process.env.OWNER_NOTIFICATION_EMAIL;

function missingEnv(name: string) {
  return new Error(`Missing required environment variable: ${name}`);
}

// ============================================================
// Google service-account credentials.
//
// Supplied entirely through GOOGLE_SERVICE_ACCOUNT_JSON. The previous
// implementation read a key file off disk via
// GOOGLE_SERVICE_ACCOUNT_KEY_PATH, which cannot work on Vercel: the key
// file is gitignored, so it exists in no deployment, and a serverless
// filesystem is not where a credential belongs anyway.
//
// Two encodings are accepted so the same variable works everywhere:
//   1. The raw JSON of the key file, starting with "{".
//   2. That same JSON, base64-encoded — preferable in a local .env file,
//      where a raw JSON value has to be quoted carefully to survive
//      dotenv parsing.
//
// Nothing here logs a credential value, and no error message includes
// one: a failure reports only which stage failed. The parsed object is
// never cached at module scope, so a rotated key takes effect on the
// next invocation rather than at the next cold start.
// ============================================================
type ServiceAccountCredentials = {
  client_email: string;
  private_key: string;
};

function loadServiceAccountCredentials(raw: string): ServiceAccountCredentials {
  const trimmed = raw.trim();

  let decoded: string;
  if (trimmed.startsWith("{")) {
    decoded = trimmed;
  } else {
    try {
      decoded = Buffer.from(trimmed, "base64").toString("utf8");
    } catch {
      throw new Error(
        "GOOGLE_SERVICE_ACCOUNT_JSON is neither JSON nor valid base64"
      );
    }
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(decoded);
  } catch {
    // Deliberately no cause/value in the message — it would echo the
    // credential into the logs.
    throw new Error("Unable to parse JSON from GOOGLE_SERVICE_ACCOUNT_JSON");
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON did not contain a JSON object");
  }

  const { client_email: clientEmail, private_key: privateKey } =
    parsed as Record<string, unknown>;

  if (typeof clientEmail !== "string" || !clientEmail) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is missing client_email");
  }
  if (typeof privateKey !== "string" || !privateKey) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is missing private_key");
  }

  return {
    client_email: clientEmail,
    // A key pasted through a shell or UI that escapes backslashes arrives
    // with literal "\n" two-character sequences instead of newlines, which
    // the crypto layer rejects. Restoring them is a no-op for a correctly
    // encoded key.
    private_key: privateKey.replace(/\\n/g, "\n"),
  };
}

// ============================================================
// HTML escaping — used ONLY for the Resend email body/subject.
// Supabase and Google Sheets always receive the raw (validated,
// trimmed) text, since escaping is an HTML-rendering concern, not
// a storage concern — escaping before storage would corrupt
// legitimate lead text (e.g. "&" becoming "&amp;" in the sheet).
// ============================================================
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ============================================================
// Server-side validation. Client-side `type="email"`/`required`
// attributes are trivially bypassed by anyone calling this API
// directly, so every field is independently type-checked, trimmed,
// and length-capped here regardless of what the browser enforced.
// No field is hard-required — the three existing public forms
// (EnquirySection, /contact, PropertyDetails) each send a different
// subset of these fields today, and none of that behavior changes.
// ============================================================
const MAX_LENGTHS = {
  name: 100,
  phone: 30,
  email: 254,
  location: 150,
  propertyId: 150,
  message: 3000,
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Permissive on purpose: accepts "+91 9876543210", "9876543210",
// "+919876543210", with optional spaces/hyphens — 7 to 20 characters
// of digits/spaces/hyphens with an optional leading "+".
const PHONE_PATTERN = /^\+?[\d\s-]{7,20}$/;

type LeadFields = {
  name: string;
  phone: string;
  email: string;
  location: string;
  message: string;
  propertyId: string;
};

function validateLeadPayload(
  body: unknown
): { ok: true; data: LeadFields } | { ok: false } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false };
  }

  const raw = body as Record<string, unknown>;
  const fields: Record<keyof typeof MAX_LENGTHS, string> = {
    name: "",
    phone: "",
    email: "",
    location: "",
    propertyId: "",
    message: "",
  };

  for (const key of Object.keys(fields) as (keyof typeof MAX_LENGTHS)[]) {
    const value = raw[key];
    if (value === undefined || value === null) continue;
    // Reject wrong types outright (e.g. name: {}, email: [], message: 123)
    // rather than silently coercing them to a string.
    if (typeof value !== "string") return { ok: false };

    const trimmed = value.trim();
    if (trimmed.length > MAX_LENGTHS[key]) return { ok: false };
    fields[key] = trimmed;
  }

  if (fields.email && !EMAIL_PATTERN.test(fields.email)) {
    return { ok: false };
  }
  if (fields.phone && !PHONE_PATTERN.test(fields.phone)) {
    return { ok: false };
  }

  // A lead is only meaningful if it's both identifiable (name) and
  // reachable (phone or email) — every existing form already enforces
  // this client-side (EnquirySection/contact/PropertyDetails all mark
  // name + phone as required; contact/PropertyDetails also collect
  // email), so this mirrors real existing intent rather than inventing
  // a new requirement. Closes the gap that let a bare `{}` (no fields
  // at all) pass as a valid "Website Enquiry" lead with no way to
  // follow up.
  if (!fields.name || (!fields.phone && !fields.email)) {
    return { ok: false };
  }

  return {
    ok: true,
    data: {
      name: fields.name,
      phone: fields.phone,
      email: fields.email,
      location: fields.location,
      message: fields.message,
      propertyId: fields.propertyId,
    },
  };
}

// ============================================================
// Rate limiting.
//
// This is an in-memory, single-process limiter. It is NOT a
// distributed rate limiter: on Vercel (or any serverless/multi-
// instance deployment), each concurrent instance has its own
// memory, so this only limits requests that happen to land on the
// same warm instance, and the count resets on every cold start.
// This is intentional per the project's low/no-cost constraint —
// adding Upstash/Redis was explicitly out of scope for this task.
//
// Documented limitation (per the fix report): this provides
// development/single-instance protection only. Reliable, global
// production enforcement for a real distributed deployment still
// requires edge/provider-level rate limiting (e.g. a WAF rule or
// Vercel's own edge rate limiting), which is outside this codebase.
// ============================================================
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX_REQUESTS = 5;

const rateLimitStore = new Map<string, { count: number; windowStart: number }>();

function pruneRateLimitStore(now: number) {
  for (const [key, entry] of rateLimitStore) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
      rateLimitStore.delete(key);
    }
  }
}

function checkRateLimit(key: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  pruneRateLimitStore(now);

  const entry = rateLimitStore.get(key);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((entry.windowStart + RATE_LIMIT_WINDOW_MS - now) / 1000)
    );
    return { allowed: false, retryAfterSeconds };
  }

  entry.count += 1;
  return { allowed: true };
}

// Identifies the caller for rate-limiting only — never logged, never
// returned in a response, never stored beyond this in-memory counter.
//
// Assumption: this app is deployed on Vercel (confirmed by the
// project's .vercel/ directory and VERCEL_OIDC_TOKEN in its env).
// Vercel's edge sets `x-forwarded-for` itself based on the real
// client connection and it is not attacker-controllable from
// outside that edge. If this app were ever self-hosted behind a
// reverse proxy that blindly forwards client-supplied headers,
// this assumption would need to be re-verified — an attacker could
// otherwise spoof this header to bypass the per-client limit.
function getClientKey(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim();
  return ip || "unknown";
}

export async function POST(request: Request) {
  try {
    if (!SHEET_ID) throw missingEnv("GOOGLE_SHEET_ID");
    if (!SERVICE_ACCOUNT_JSON) throw missingEnv("GOOGLE_SERVICE_ACCOUNT_JSON");
    if (!RESEND_API_KEY) throw missingEnv("RESEND_API_KEY");
    if (!RESEND_FROM_EMAIL) throw missingEnv("RESEND_FROM_EMAIL");
    if (!OWNER_NOTIFICATION_EMAIL) throw missingEnv("OWNER_NOTIFICATION_EMAIL");

    const rateLimit = checkRateLimit(getClientKey(request));
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: rateLimit.retryAfterSeconds
            ? { "Retry-After": String(rateLimit.retryAfterSeconds) }
            : undefined,
        }
      );
    }

    const rawBody = await request.json().catch(() => null);
    const validated = validateLeadPayload(rawBody);
    if (!validated.ok) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { name, phone, email, location, message, propertyId } = validated.data;

    // Best-effort: also record this enquiry in the Supabase "leads"
    // table the admin/broker CRM reads from (existing leads_public_insert
    // RLS policy already allows anon inserts — no service role needed).
    // Isolated in its own try/catch so a failure here never breaks the
    // existing Sheets/email notification below.
    try {
      const supabase = await createClient();

      // Property attribution.
      //
      // Resolved with the SERVICE-ROLE client, not the anonymous one, so this
      // keeps working once anon SELECT on public.properties is withdrawn for
      // the pre-registration period. Previously this read depended on
      // properties_public_read_approved; removing that policy would have made
      // every enquiry silently unattributed, because the lookup below fails
      // soft rather than erroring.
      //
      // The service-role client bypasses RLS, so the predicate that policy
      // used to enforce is RESTATED HERE EXPLICITLY — approved and not
      // soft-deleted. Without it, bypassing RLS would widen the lookup rather
      // than preserve it, letting an enquiry attach to a rejected, pending or
      // soft-deleted listing that the public can no longer see.
      //
      // Only `id` is selected and only `id` is ever used. Nothing about the
      // property reaches the HTTP response, the lead row, the Sheet or the
      // notification email — the caller supplies a slug and learns nothing it
      // did not already know. An unmatched slug yields null, exactly as an
      // unreadable row did before.
      //
      // Wrapped in its own try/catch: a service-role misconfiguration must
      // degrade to an unattributed lead, never cost us the lead itself.
      let resolvedPropertyId: string | null = null;
      if (propertyId) {
        try {
          const admin = createAdminClient();
          const { data: property, error: lookupError } = await admin
            .from("properties")
            .select("id")
            .eq("slug", propertyId)
            .eq("approval_status", "approved")
            .is("deleted_at", null)
            .maybeSingle();

          if (lookupError) {
            console.error("lead_error", "property_lookup_failed", lookupError);
          }
          resolvedPropertyId = property?.id ?? null;
        } catch (err) {
          console.error("lead_error", "property_lookup_exception", err);
        }
      }

      const { error: leadError } = await supabase.from("leads").insert({
        buyer_name: name || "Website Enquiry",
        buyer_phone: phone || null,
        buyer_email: email || null,
        message: location ? `${message}\n\nInterested location: ${location}`.trim() : message || null,
        property_id: resolvedPropertyId,
        status: "new",
      });

      if (leadError) {
        console.error("lead_error", "supabase_insert_failed", leadError);
      } else {
        console.log("lead_step", "supabase_insert_success");
      }
    } catch (err) {
      console.error("lead_error", "supabase_insert_exception", err);
    }

    // Credentials come from the environment, never the filesystem — see
    // loadServiceAccountCredentials above. Only the failure stage is
    // logged; the credential itself never reaches the logs.
    let credentials;
    try {
      credentials = loadServiceAccountCredentials(SERVICE_ACCOUNT_JSON);
      console.log("lead_step", "service_account_loaded");
    } catch (err) {
      console.error(
        "lead_error",
        "load_service_account_credentials",
        err instanceof Error ? err.message : "unknown error"
      );
      throw err;
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Initialize headers if they don't exist
    try {
      const headerCheckResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: "Sheet1!A1:G1",
      });

      if (!headerCheckResponse.data.values || headerCheckResponse.data.values.length === 0) {
        const headers = [["Timestamp", "Name", "Phone", "Email", "Location", "Message", "Property ID"]];
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: "Sheet1!A1:G1",
          valueInputOption: "RAW",
          requestBody: { values: headers },
        });
        console.log("lead_step", "headers_initialized");
      }
    } catch (err) {
      console.warn("lead_step", "header_check_failed", err);
    }

    const timestamp = new Date().toISOString();
    const values = [[timestamp, name, phone, email, location, message, propertyId]];

    console.log("lead_step", "before_sheet_append", {
      spreadsheetId: SHEET_ID,
      range: SHEET_RANGE,
    });

    // RAW (not USER_ENTERED): stores every value as literal text.
    // USER_ENTERED would let a value starting with =, +, -, or @ be
    // parsed as a spreadsheet formula — a confirmed CSV/Sheets
    // injection vector for a publicly-submitted field.
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: SHEET_RANGE,
      valueInputOption: "RAW",
      requestBody: { values },
    });

    console.log("lead_step", "sheet_append_success");

    const resend = new Resend(RESEND_API_KEY);
    const safeName = escapeHtml(name);
    const safePhone = escapeHtml(phone);
    const safeEmail = escapeHtml(email);
    const safeLocation = escapeHtml(location);
    const safePropertyId = escapeHtml(propertyId);
    const safeMessage = escapeHtml(message);

    const html = `
      <h1>New Enquiry Received</h1>
      <p><strong>Name:</strong> ${safeName || "(not provided)"}</p>
      <p><strong>Phone:</strong> ${safePhone || "(not provided)"}</p>
      <p><strong>Email:</strong> ${safeEmail || "(not provided)"}</p>
      <p><strong>Location:</strong> ${safeLocation || "(not provided)"}</p>
      <p><strong>Property ID:</strong> ${safePropertyId || "(not provided)"}</p>
      <p><strong>Message:</strong><br/>${safeMessage || "(not provided)"}</p>
      <p><em>Received at ${timestamp}</em></p>
    `;

    console.log("lead_step", "before_resend_send", { from: RESEND_FROM_EMAIL, to: OWNER_NOTIFICATION_EMAIL });
    const resendResponse = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: OWNER_NOTIFICATION_EMAIL,
      subject: `New lead from ${safeName || "website"}`,
      html,
    });
    console.log("lead_step", "resend_success", resendResponse);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("lead error", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
