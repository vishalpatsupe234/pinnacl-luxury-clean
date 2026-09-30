-- Pinnacl Properties — P1: lead source + response tracking
--
-- ############################################################
-- WHY
--
-- The 2026-09-29 master audit found that public.leads could not answer four
-- questions that every later measurement depends on:
--
--     Where did this lead come from?
--     When was it assigned?
--     When was the customer actually contacted?
--     When is the next action due?
--
-- Without them there is no channel attribution, no response-time measurement
-- and no follow-up discipline. This migration adds exactly those four
-- columns and nothing else.
--
-- It also closes finding R1 (an active broker could write ANY column on a
-- lead assigned to them, via direct PostgREST) with a column-guard trigger,
-- because two of the new columns are broker-writable and the other two must
-- not be.
-- ############################################################

-- ============================================================
-- DELIBERATELY NOT CHANGED
--
--   leads.status         — the seven stages stay exactly as they are
--                          (new, contacted, qualified, site_visit,
--                          negotiation, closed, lost). No stage is added,
--                          removed or renamed, and leads_status_check is
--                          not touched.
--   existing columns     — nothing is dropped, renamed or retyped.
--   existing rows        — all four new columns are nullable with no
--                          default, so all 17 existing leads (1 live, 16
--                          archived) keep working unchanged and are simply
--                          recorded as "source not known", which is true.
--                          No backfill is performed: inventing a source for
--                          a historical lead would be fabricating data.
--   RLS policies         — not weakened, not widened, not replaced. The
--                          policies from 20260927090000 stand verbatim.
--   deleted_at / archive — untouched; archive and restore keep working.
--   leads_public_insert  — untouched; anonymous enquiry submission is
--                          unaffected.
--   DELETE               — still no DELETE policy for any role.
-- ============================================================

-- ============================================================
-- 1. COLUMNS
-- ============================================================
alter table public.leads
  add column if not exists lead_source    text,
  add column if not exists assigned_at    timestamptz,
  add column if not exists contacted_at   timestamptz,
  add column if not exists next_action_at timestamptz;

-- lead_source is constrained to a fixed allowlist rather than left free
-- text, so the column stays aggregatable. NULL is deliberately permitted
-- and means "not recorded" — that is the honest value for every lead that
-- predates this migration, and for an admin-entered lead whose origin is
-- genuinely unknown.
--
-- The list mirrors LEAD_SOURCES in lib/supabase/types.ts exactly, the same
-- arrangement already used for LEAD_STAGES and leads_status_check: one
-- runtime whitelist in TypeScript for clean 400s at the API boundary, one
-- CHECK constraint in Postgres as the boundary that cannot be bypassed.
-- Keep the two in sync; neither is authoritative alone.
--
-- Campaign-level attribution (UTM parameters, ad sets, keywords) is NOT
-- modelled here and is not a future column on this table — it belongs in a
-- separate campaign entity if it is ever built. P1 is channel only.
alter table public.leads
  drop constraint if exists leads_lead_source_check;

alter table public.leads
  add constraint leads_lead_source_check
  check (
    lead_source is null
    or lead_source in (
      'website', 'whatsapp', 'facebook', 'instagram',
      'google', 'referral', 'direct', 'other'
    )
  );

comment on column public.leads.lead_source is
  'Acquisition channel, from a fixed allowlist (see leads_lead_source_check and LEAD_SOURCES in lib/supabase/types.ts). NULL means not recorded - the correct value for leads created before 2026-09-29. Public web-form leads are always stamped website server-side by /api/leads, which ignores any client-supplied value; off-platform origins (whatsapp, referral, ...) are recorded by the admin at manual entry.';

comment on column public.leads.assigned_at is
  'When the lead was assigned to its current broker. Maintained ENTIRELY by the leads_assignment_timestamp trigger - never written by application code and never accepted from a request body, so it cannot be forged or backdated. NULL whenever assigned_broker_id is NULL.';

comment on column public.leads.contacted_at is
  'When the customer was actually contacted. Set only by a deliberate "Mark contacted" action in the admin or broker UI, with a server-generated timestamp. It is NOT set by lead creation, by assignment, by opening the lead, or as a side effect of any stage change - a stage moved to contacted by hand is a label, not evidence of a call.';

comment on column public.leads.next_action_at is
  'Next planned follow-up. Set, changed or cleared by the admin or the assigned broker. This is a single scalar reminder field, deliberately not a task table - no scheduler, reminder or notification reads it yet.';

-- ============================================================
-- 2. INDEXES
--
-- Matches the existing convention on this schema (lead_notes_lead_id_idx
-- and friends). Both are small and pay for themselves on the two queries
-- P1 makes possible: "leads by channel" and "follow-ups now due".
-- The next_action_at index is partial — a NULL next action is the common
-- case and is never the thing being searched for.
-- ============================================================
create index if not exists leads_lead_source_idx
  on public.leads (lead_source);

create index if not exists leads_next_action_at_idx
  on public.leads (next_action_at)
  where next_action_at is not null;

-- ============================================================
-- 3. assigned_at — maintained by trigger, not by application code
--
-- The instruction was explicit: do not trust the browser to supply this
-- timestamp. A trigger is stronger than doing it in the route handler,
-- because it holds for EVERY write path — the admin API, a future bulk
-- reassignment, a manual SQL correction — rather than only the one route
-- that remembered to set it.
--
-- Semantics:
--   unassigned -> broker      assigned_at = now()
--   broker A   -> broker B    assigned_at = now()   (reassignment restarts
--                                                    the clock; the new
--                                                    broker is measured from
--                                                    when THEY received it)
--   broker     -> unassigned  assigned_at = NULL
--   no change to assigned_broker_id   assigned_at untouched, so an
--                                     unrelated edit (stage, note, archive)
--                                     never bumps it
--
-- Prior assignment history is not lost by the reassignment reset: the
-- existing leads_audit trigger already records every UPDATE with before and
-- after values in public.audit_log, so the full assignment chain remains
-- reconstructible. This column answers "since when does the CURRENT broker
-- hold it", which is the question response-time measurement asks.
--
-- Named so it sorts before leads_broker_column_guard: BEFORE triggers on
-- the same table and timing fire in name order, and the guard must see the
-- value this trigger has already written rather than reject it.
-- ============================================================
create or replace function public.maintain_lead_assignment_timestamp()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    -- A lead created already assigned is assigned as of now. A lead created
    -- unassigned has no assignment time. Any value supplied by the caller is
    -- overwritten either way.
    new.assigned_at := case
      when new.assigned_broker_id is null then null
      else now()
    end;
    return new;
  end if;

  if new.assigned_broker_id is distinct from old.assigned_broker_id then
    new.assigned_at := case
      when new.assigned_broker_id is null then null
      else now()
    end;
  else
    -- Unchanged assignment: preserve the stored value verbatim, ignoring
    -- anything the caller tried to put in this column.
    new.assigned_at := old.assigned_at;
  end if;

  return new;
end;
$$;

comment on function public.maintain_lead_assignment_timestamp() is
  'Keeps public.leads.assigned_at in lockstep with assigned_broker_id. The column is trigger-owned: a value supplied by any caller, including a request body or direct SQL, is always overwritten.';

drop trigger if exists leads_assignment_timestamp on public.leads;

create trigger leads_assignment_timestamp
  before insert or update on public.leads
  for each row execute function public.maintain_lead_assignment_timestamp();

-- ============================================================
-- 4. FINDING R1 — column guard for broker UPDATEs
--
-- leads_broker_update_assigned lets an ACTIVE broker update a lead assigned
-- to them. RLS is row-level: PostgreSQL cannot restrict which COLUMNS a
-- policy permits, so that same policy also let a broker rewrite the buyer's
-- name, phone and email, edit the enquiry message, change property
-- attribution, or set deleted_at and quietly archive a lead out of the
-- admin's Active view — all with nothing but their own session and the
-- public publishable key, bypassing the broker API entirely.
--
-- A trigger is the only mechanism that can express a column rule. This is
-- the same technique already used on public.profiles by
-- enforce_profile_role_change_admin_only(), for the same reason.
--
-- The broker's legitimate working surface is exactly three columns:
--     status          — move the lead through the pipeline
--     contacted_at    — record that they made contact
--     next_action_at  — plan their own follow-up
-- Everything else on the row is admin-owned or trigger-owned. Notes remain
-- the broker's channel for adding information, and lead_notes is
-- append-only, so nothing here removes their ability to contribute.
--
-- TWO CALLERS PASS STRAIGHT THROUGH, and both are deliberate:
--
--   auth.uid() is null — no end-user session. public.leads has no anon
--                        UPDATE policy (only leads_public_insert, for
--                        INSERT), so this can only be the service role, a
--                        migration, or the SQL editor — trusted server
--                        contexts already unconstrained by RLS. Letting
--                        them through keeps future backfills and manual
--                        data repair possible; the guard exists to
--                        constrain BROKER SESSIONS, which always carry a
--                        uid.
--
--   is_super_admin()   — the admin API legitimately edits every field.
--
-- Everyone else — i.e. any authenticated non-admin, which in this schema
-- means a broker or sales partner — is held to the three columns.
--
-- OPERATIONAL CONSEQUENCE: none for admins, and none for the SQL editor
-- (auth.uid() is null there). This is a narrower guard than the profiles
-- one, which does block SQL editor edits.
-- ============================================================
create or replace function public.enforce_lead_broker_column_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_super_admin() then
    return new;
  end if;

  if new.id                    is distinct from old.id
     or new.property_id        is distinct from old.property_id
     or new.buyer_name         is distinct from old.buyer_name
     or new.buyer_phone        is distinct from old.buyer_phone
     or new.buyer_email        is distinct from old.buyer_email
     or new.message            is distinct from old.message
     or new.assigned_broker_id is distinct from old.assigned_broker_id
     or new.lead_source        is distinct from old.lead_source
     or new.assigned_at        is distinct from old.assigned_at
     or new.deleted_at         is distinct from old.deleted_at
     or new.created_at         is distinct from old.created_at
  then
    raise exception
      'A broker may only change status, contacted_at and next_action_at on an assigned lead';
  end if;

  return new;
end;
$$;

comment on function public.enforce_lead_broker_column_guard() is
  'Closes finding R1. RLS is row-level and cannot restrict columns, so this trigger restricts a non-admin authenticated caller (i.e. a broker) to status, contacted_at and next_action_at. Sessionless callers (service role, migrations, SQL editor) and super_admin pass through.';

drop trigger if exists leads_broker_column_guard on public.leads;

create trigger leads_broker_column_guard
  before update on public.leads
  for each row execute function public.enforce_lead_broker_column_guard();

-- ============================================================
-- ROLLBACK (for reference — not executed by this migration)
--
--   drop trigger if exists leads_broker_column_guard on public.leads;
--   drop function if exists public.enforce_lead_broker_column_guard();
--   drop trigger if exists leads_assignment_timestamp on public.leads;
--   drop function if exists public.maintain_lead_assignment_timestamp();
--   drop index if exists public.leads_next_action_at_idx;
--   drop index if exists public.leads_lead_source_idx;
--   alter table public.leads drop constraint if exists leads_lead_source_check;
--   alter table public.leads
--     drop column if exists next_action_at,
--     drop column if exists contacted_at,
--     drop column if exists assigned_at,
--     drop column if exists lead_source;
--
-- Dropping the columns discards the data they hold; dropping only the two
-- triggers reopens R1 and stops assigned_at being maintained, while leaving
-- every recorded value intact.
-- ============================================================

-- ============================================================
-- POST-APPLY VERIFICATION (read-only — run separately, not part of this file)
--
--   select column_name, data_type, is_nullable
--   from information_schema.columns
--   where table_schema='public' and table_name='leads'
--     and column_name in ('lead_source','assigned_at','contacted_at','next_action_at')
--   order by column_name;
--   -- expect 4 rows, all is_nullable = YES
--
--   select tgname from pg_trigger
--   where tgrelid='public.leads'::regclass and not tgisinternal order by tgname;
--   -- expect: leads_assignment_timestamp, leads_audit,
--   --         leads_broker_column_guard, leads_set_updated_at
--   -- note the name order: leads_assignment_timestamp fires before the guard
--
--   select count(*) from public.leads;                            -- expect 17
--   select count(*) from public.leads where lead_source is null;  -- expect 17
--
--   select policyname, cmd from pg_policies
--   where schemaname='public' and tablename='leads' order by policyname;
--   -- expect the same 3 policies as before this migration
--
-- Behavioural, against live sessions:
--   admin assigns a lead        -> assigned_at becomes non-null
--   admin unassigns it          -> assigned_at returns to null
--   admin edits only the stage  -> assigned_at unchanged
--   broker updates status       -> succeeds
--   broker sets contacted_at    -> succeeds
--   broker sets next_action_at  -> succeeds, and clearing it succeeds
--   broker sets deleted_at via direct PostgREST   -> rejected (R1 closed)
--   broker sets buyer_phone via direct PostgREST  -> rejected (R1 closed)
--   broker sets assigned_broker_id                -> rejected by RLS WITH
--                                                    CHECK before the guard
--   anonymous /contact enquiry  -> still inserts, lead_source = 'website'
-- ============================================================
