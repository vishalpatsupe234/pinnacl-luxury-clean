import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { istDateKey } from "@/lib/leads/leadDisplay";
import {
  founderEmail,
  resolveBrokerEmails,
} from "@/lib/notifications/recipients";
import { escapeHtml, sendInternalEmail, siteUrl } from "@/lib/notifications/send";

// Phase 1 follow-up automation — the single daily job.
//
// Covers four reminders in one run: first-contact SLA (C), follow-up due today
// (D), overdue follow-up (E), and the founder digest (G). One cron, one
// handler, no orchestration platform — see CLAUDE.md for that decision.
//
// ############################################################
// THIS JOB IS READ-ONLY AGAINST THE CRM. It issues SELECT only.
//
// It never writes status, assigned_broker_id, contacted_at, next_action_at,
// lead_source, buyer fields, requirement fields or deleted_at. It cannot
// advance a lead, mark anything contacted, or archive anything. The only
// outbound effect is email.
//
// That is a deliberate safety property, not an accident of the current
// requirements: an automation that reminds cannot corrupt the pipeline it is
// reminding about, however wrong its logic turns out to be.
// ############################################################
//
// STATE-DERIVED, NOT QUEUED. Every list below is recomputed from current table
// state on each run. A missed run self-heals on the next one, and nothing is
// mutated to record "already emailed".
//
// ACCEPTED CONSEQUENCE: there is no email de-duplication. If the cron fires
// twice in one day, the same reminders are sent twice. De-duplicating properly
// would need a notification_log table — a schema change, deliberately excluded
// from this phase. At one or two emails a day a duplicate is noise, not damage.

// Vercel attaches `Authorization: Bearer <CRON_SECRET>` to cron invocations
// when that variable is set, which is why the header is the check.
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;

  // Fail CLOSED. An unset secret makes the route permanently unreachable
  // rather than publicly open — a misconfiguration must not become an open
  // endpoint that anyone can use to trigger our own notification emails.
  if (!secret) {
    console.error("job_error", "cron_secret_not_configured");
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

type LeadRow = {
  id: string;
  buyer_name: string;
  status: string;
  assigned_broker_id: string | null;
  assigned_at: string | null;
  contacted_at: string | null;
  next_action_at: string | null;
  created_at: string;
};

/** One line per lead in an email. Buyer name is escaped; nothing else about the buyer is included. */
function leadLine(lead: LeadRow, base: string): string {
  return `<li>${escapeHtml(lead.buyer_name)} — <a href="${base}/admin/leads">open in CRM</a></li>`;
}

function listBlock(heading: string, leads: LeadRow[], base: string): string {
  if (leads.length === 0) return "";
  return `<p><strong>${heading} (${leads.length})</strong></p><ul>${leads
    .map((l) => leadLine(l, base))
    .join("")}</ul>`;
}

export async function GET(request: Request) {
  // 401 before anything else runs: no database read, no logging of the
  // attempt, and a bare message that reveals nothing about the secret.
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const now = new Date();
    const todayIst = istDateKey(now);
    const base = siteUrl();

    // Service role is used because this job has no end-user session to carry.
    // The read is narrowed to the columns the reminders need — no buyer phone,
    // no buyer email, no enquiry message.
    const { data: leadsData, error: leadsError } = await admin
      .from("leads")
      .select(
        "id, buyer_name, status, assigned_broker_id, assigned_at, contacted_at, next_action_at, created_at"
      )
      .is("deleted_at", null);

    if (leadsError) {
      console.error("job_error", "leads_read_failed", leadsError.code);
      return NextResponse.json({ error: "Job failed" }, { status: 500 });
    }

    const leads = (leadsData ?? []) as LeadRow[];

    const { data: visitsData, error: visitsError } = await admin
      .from("site_visits")
      .select("id, lead_id, property_id, visit_date");

    if (visitsError) {
      // Non-fatal: the digest simply omits site visits rather than failing.
      console.error("job_error", "site_visits_read_failed", visitsError.code);
    }

    const dayMs = 86_400_000;
    const nowMs = now.getTime();

    // ---- Buckets. All date comparisons go through the IST calendar date. ----
    const newLast24h = leads.filter(
      (l) => nowMs - new Date(l.created_at).getTime() < dayMs
    );
    const unassigned = leads.filter((l) => !l.assigned_broker_id);

    // C — first-contact SLA: assigned, never contacted, assigned over 24h ago.
    const uncontacted = leads.filter(
      (l) =>
        l.assigned_broker_id &&
        !l.contacted_at &&
        l.assigned_at !== null &&
        nowMs - new Date(l.assigned_at).getTime() > dayMs
    );

    // D / E — due today vs overdue, by IST calendar date, never raw timestamps.
    const dueToday = leads.filter(
      (l) => l.next_action_at && istDateKey(l.next_action_at) === todayIst
    );
    const overdue = leads.filter((l) => {
      const key = l.next_action_at ? istDateKey(l.next_action_at) : null;
      return key !== null && todayIst !== null && key < todayIst;
    });

    const visitsToday = (visitsData ?? []).filter(
      (v) => istDateKey((v as { visit_date: string }).visit_date) === todayIst
    );

    // ---- Per-broker reminders (C + D + E combined into one email each) ----
    //
    // One email per broker rather than three: the broker needs a single list of
    // what to do today, not three notifications about the same lead.
    const brokerBuckets = new Map<
      string,
      { uncontacted: LeadRow[]; dueToday: LeadRow[]; overdue: LeadRow[] }
    >();
    const bucketFor = (id: string) => {
      if (!brokerBuckets.has(id)) {
        brokerBuckets.set(id, { uncontacted: [], dueToday: [], overdue: [] });
      }
      return brokerBuckets.get(id)!;
    };

    for (const l of uncontacted) bucketFor(l.assigned_broker_id!).uncontacted.push(l);
    for (const l of dueToday) if (l.assigned_broker_id) bucketFor(l.assigned_broker_id).dueToday.push(l);
    for (const l of overdue) if (l.assigned_broker_id) bucketFor(l.assigned_broker_id).overdue.push(l);

    // Ineligible brokers resolve to nothing and are therefore never contacted:
    // suspended, rejected, pending and soft-deleted accounts all drop out here.
    const brokerEmails = await resolveBrokerEmails([...brokerBuckets.keys()]);

    let brokerEmailsSent = 0;
    let brokerEmailsFailed = 0;
    let brokerEmailsSkipped = 0;

    for (const [brokerId, bucket] of brokerBuckets) {
      const to = brokerEmails.get(brokerId);
      if (!to) {
        // Not an error: the broker is simply not an eligible recipient.
        brokerEmailsSkipped += 1;
        continue;
      }

      const html = `
      <h1>Your Pinnacl follow-ups today</h1>
      ${listBlock("Not contacted yet — assigned over 24 hours ago", bucket.uncontacted, base)}
      ${listBlock("Follow-up due today", bucket.dueToday, base)}
      ${listBlock("Overdue follow-up", bucket.overdue, base)}
      <p style="color:#7C7C76;font-size:12px">Open <a href="${base}/broker/leads">My Leads</a> to update a stage, mark a lead contacted, or set the next follow-up.</p>
    `;

      const result = await sendInternalEmail({
        to,
        subject: "Pinnacl — your follow-ups today",
        html,
        stage: "broker_followup_digest",
      });
      if (result.ok) brokerEmailsSent += 1;
      else brokerEmailsFailed += 1;
    }

    // ---- G — founder digest ----
    //
    // Unassigned leads surface here specifically because no broker email can
    // carry them: there is no broker to send them to.
    const founder = founderEmail();
    let founderEmailSent = false;

    if (founder) {
      const unassignedDue = dueToday.filter((l) => !l.assigned_broker_id);
      const unassignedOverdue = overdue.filter((l) => !l.assigned_broker_id);

      const html = `
      <h1>Pinnacl daily summary</h1>
      <p><strong>New leads (24h):</strong> ${newLast24h.length}<br/>
         <strong>Unassigned:</strong> ${unassigned.length}<br/>
         <strong>Not contacted &gt;24h:</strong> ${uncontacted.length}<br/>
         <strong>Follow-ups due today:</strong> ${dueToday.length}<br/>
         <strong>Overdue follow-ups:</strong> ${overdue.length}<br/>
         <strong>Site visits today:</strong> ${visitsToday.length}</p>
      ${listBlock("Unassigned", unassigned, base)}
      ${listBlock("Follow-up due today, no broker assigned", unassignedDue, base)}
      ${listBlock("Overdue, no broker assigned", unassignedOverdue, base)}
      <p style="color:#7C7C76;font-size:12px">Open the <a href="${base}/admin/leads">lead CRM</a>.</p>
    `;

      const result = await sendInternalEmail({
        to: founder,
        subject: "Pinnacl — daily summary",
        html,
        stage: "founder_digest",
      });
      founderEmailSent = result.ok;
    } else {
      console.error("job_error", "owner_notification_email_not_configured");
    }

    // Counts only. No lead id, no buyer name, no address — nothing in this
    // body identifies a person.
    console.log(
      "job_done",
      "daily",
      `leads=${leads.length}`,
      `due=${dueToday.length}`,
      `overdue=${overdue.length}`,
      `uncontacted=${uncontacted.length}`
    );

    return NextResponse.json({
      ok: true,
      istDate: todayIst,
      counts: {
        activeLeads: leads.length,
        newLast24h: newLast24h.length,
        unassigned: unassigned.length,
        uncontactedOver24h: uncontacted.length,
        dueToday: dueToday.length,
        overdue: overdue.length,
        siteVisitsToday: visitsToday.length,
      },
      emails: {
        brokerEmailsSent,
        brokerEmailsFailed,
        brokerEmailsSkipped,
        founderEmailSent,
      },
    });
  } catch (err) {
    // A send failure cannot reach here — sendInternalEmail never throws — so
    // this only catches a genuine job fault, and even then nothing was written.
    console.error(
      "job_error",
      "daily_failed",
      err instanceof Error ? err.message : "unknown error"
    );
    return NextResponse.json({ error: "Job failed" }, { status: 500 });
  }
}
