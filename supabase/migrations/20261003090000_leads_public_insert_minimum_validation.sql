-- Pinnacl Properties — close the anonymous lead-injection vector
--
-- ############################################################
-- WHAT WAS WRONG (finding P1-1, 2026-10-02 production audit)
--
-- leads_public_insert was:
--
--     to anon, authenticated
--     with check (true)
--
-- Unconditional. /api/leads enforces real validation — a name plus at least
-- one of phone/email — and a 5-per-10-minute rate limit, but BOTH live in the
-- route handler. The publishable key ships in the client bundle by design, so
-- anyone can skip the route entirely and POST straight to PostgREST.
--
-- This was not theoretical. It was proven during the audit: a single request
--
--     POST /rest/v1/leads  {"buyer_name":""}
--
-- returned 201 CREATED and inserted a row with an empty name and no contact
-- details. `buyer_name` is NOT NULL, but '' is not NULL, so nothing stopped
-- it. A script could have added unlimited junk rows, poisoning the CRM, the
-- daily digest counts and the Google Sheet backup.
--
-- This migration moves the MINIMUM of that validation to the layer that
-- cannot be bypassed. The route keeps its fuller validation and its rate
-- limiting; neither is removed or relaxed.
-- ############################################################

-- ============================================================
-- WHY A POLICY AND NOT A CHECK CONSTRAINT
--
-- A table CHECK constraint would apply to every writer equally, including the
-- admin CRM — and the admin manual-entry path deliberately allows a lead with
-- a name but no contact details yet (app/api/admin/leads/route.ts requires
-- buyer_name only). A constraint would break logging a walk-in whose number
-- you do not have yet.
--
-- An RLS WITH CHECK can distinguish the caller, which is exactly the
-- distinction needed here: constrain the public, leave the operator alone.
-- ============================================================

-- ============================================================
-- WHY super_admin IS EXEMPTED FROM THE CONTACT-DETAIL RULE
--
-- VERIFIED against the two insert paths before writing this:
--
--   app/api/leads/route.ts (public form)
--     buyer_name:  name || "Website Enquiry"      -> never empty
--     buyer_phone: phone || null
--     buyer_email: email || null
--     and validateLeadPayload() already requires a name AND (phone OR email),
--     so every legitimate website submission satisfies the new predicate.
--     THIS MIGRATION CANNOT BREAK THE PUBLIC FORM.
--
--   app/api/admin/leads/route.ts (manual entry)
--     requires buyer_name, but phone and email are BOTH optional.
--     Without the is_super_admin() arm, an admin logging a phone-in lead with
--     only a name would start failing. That would be a regression introduced
--     by a security fix — the exact kind of collateral damage to avoid.
--
-- The name requirement applies to EVERYONE, admin included: a nameless lead is
-- not useful to anybody, and the admin route already enforces it.
-- ============================================================

-- ============================================================
-- DELIBERATELY NOT CHANGED
--
--   leads_broker_read_assigned   — SELECT policy untouched. Anonymous SELECT
--                                  on leads remains impossible.
--   leads_broker_update_assigned — UPDATE policy untouched.
--   DELETE                       — still no DELETE policy for any role.
--   leads_00_broker_column_guard — the R1 column guard is not touched.
--   leads_assignment_timestamp   — not touched.
--   leads_status_check, leads_lead_source_check, the budget/requirement
--   constraints                  — none altered.
--   every other table and policy  — untouched. This migration names only
--                                  public.leads and only its INSERT policy.
--   /api/leads validation + rate limiting — unchanged in code. This is
--                                  defence in depth beneath them, not a
--                                  replacement for them.
-- ============================================================

-- btrim() is used rather than trim() for explicitness, and coalesce() guards
-- the NULL case so a NULL phone and a NULL email both read as absent rather
-- than making the whole expression NULL (which RLS treats as a failure, but
-- relying on that would be obscure).
--
-- Drop-before-create because CREATE POLICY has no IF NOT EXISTS; this also
-- makes the migration safe to re-run.
drop policy if exists leads_public_insert on public.leads;

create policy leads_public_insert
  on public.leads for insert
  to anon, authenticated
  with check (
    -- A name is required of every caller.
    buyer_name is not null
    and btrim(buyer_name) <> ''
    and (
      -- Operators may record a lead before contact details are known.
      public.is_super_admin()
      -- Everyone else must supply at least one way to reach the buyer,
      -- mirroring validateLeadPayload() in app/api/leads/route.ts.
      or coalesce(btrim(buyer_phone), '') <> ''
      or coalesce(btrim(buyer_email), '') <> ''
    )
  );

comment on policy leads_public_insert on public.leads is
  'Public enquiry submission, with the minimum of /api/leads'' validation enforced at the layer the publishable key cannot bypass: a non-blank buyer_name for every caller, plus at least one of buyer_phone/buyer_email for anyone who is not super_admin. Closes P1-1 (2026-10-02 audit), where with check (true) allowed anonymous injection of unlimited blank leads straight into PostgREST. super_admin is exempt from the contact-detail rule only, because the admin CRM deliberately supports logging a lead before a number is known. Rate limiting remains in /api/leads and is NOT duplicated here.';

-- ============================================================
-- ROLLBACK (for reference — not executed by this migration)
--
--   drop policy if exists leads_public_insert on public.leads;
--   create policy leads_public_insert
--     on public.leads for insert
--     to anon, authenticated
--     with check (true);
--
-- Restores the definition from 20260816120200_row_level_security.sql exactly,
-- and reopens P1-1. Policy definition only — no data is touched.
-- ============================================================

-- ============================================================
-- POST-APPLY VERIFICATION (read-only — run separately, not part of this file)
--
--   select policyname, cmd, roles::text, with_check
--   from pg_policies where schemaname='public' and tablename='leads'
--   order by policyname;
--   -- expect exactly 3 policies, unchanged names:
--   --   leads_broker_read_assigned (SELECT)
--   --   leads_broker_update_assigned (UPDATE)
--   --   leads_public_insert (INSERT)  <- with_check now non-trivial
--
--   select count(*) from pg_policies
--    where schemaname='public' and tablename='leads' and cmd='DELETE';
--   -- expect 0
--
--   select tgname from pg_trigger
--   where tgrelid='public.leads'::regclass and not tgisinternal order by tgname;
--   -- expect the SAME 4: leads_00_broker_column_guard,
--   --   leads_assignment_timestamp, leads_audit, leads_set_updated_at
--
--   select count(*) from public.leads;   -- expect 18, unchanged
--
-- Behavioural, with the ANONYMOUS publishable key against PostgREST:
--   {"buyer_name":""}                              -> REJECTED (42501)
--   {"buyer_name":"   "}                           -> REJECTED (whitespace)
--   {"buyer_name":"A"}                             -> REJECTED (no contact)
--   {"buyer_name":"A","buyer_phone":"  "}          -> REJECTED (blank phone)
--   {"buyer_name":"A","buyer_phone":"9999999999"}  -> accepted (creates a row)
--   SELECT / UPDATE / DELETE on leads               -> still blocked
--
-- And through the application:
--   /contact form submission      -> still succeeds (name + phone required)
--   admin manual lead, name only  -> still succeeds (super_admin arm)
-- ============================================================
