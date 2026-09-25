-- Pinnacl Properties — Stage 0 safety foundation
-- Audit provenance + audit PII minimisation
--
-- PROBLEM 1 — provenance.
-- log_audit_event() records auth.uid() as the actor. auth.uid() is NULL for
-- anything that is not an end-user session, so public lead submissions (anon
-- key) and service-role operations were logged with actor_id = NULL and no
-- indication of which they were. Measured on live data before this change:
-- 38 of 47 audit rows (81%) had actor_id NULL, covering both public form
-- inserts and service-role maintenance. "Unattributed" was therefore
-- ambiguous rather than merely missing.
--
-- This migration does NOT invent a human actor for those rows. It adds an
-- explicit actor_type so a NULL actor_id can be read correctly:
--   authenticated_user — a real end-user session; actor_id is set
--   public_form        — anonymous request (public lead capture)
--   service_role       — backend/maintenance using the service key
--   system             — no request context (SQL editor, cron, migration)
--
-- PROBLEM 2 — PII duplication.
-- The trigger stores to_jsonb(OLD) and to_jsonb(NEW) wholesale, so every
-- lead change copied buyer name, phone, email and free-text message into
-- audit_log — a table that deliberately has no UPDATE or DELETE policy for
-- any role. Personal data was therefore being written to a store from which
-- it cannot be corrected or erased, which conflicts with any future erasure
-- obligation.
--
-- Values for known personal-data columns are replaced with a '[redacted]'
-- marker. NULL is preserved as NULL, so "was this field set?" and "did it
-- change from absent to present?" remain answerable while the content does
-- not persist. A hash was considered and rejected: a 10-digit mobile number
-- has a small enough keyspace to be trivially reversed, so a hash would give
-- the appearance of protection without the substance.
--
-- SCOPE NOTE: this changes behaviour for rows written from now on. It does
-- NOT rewrite the existing audit_log rows that already contain buyer PII.
-- Retro-redaction would mean UPDATEing an append-only audit table and
-- modifying production data; that is a separate, explicitly-authorised
-- decision. See the open item in the Stage 0 report.

-- ============================================================
-- 1. Provenance column
-- ============================================================
alter table public.audit_log
  add column if not exists actor_type text
    check (actor_type in ('authenticated_user', 'public_form', 'service_role', 'system'));

comment on column public.audit_log.actor_type is
  'How the change reached the database. Distinguishes a genuine end-user session from anonymous public submissions, service-role operations and context-free SQL. A NULL actor_id is only meaningful when read together with this column.';

create index if not exists audit_log_actor_type_idx on public.audit_log (actor_type);

-- ============================================================
-- 2. Personal-data redaction helper
--
-- Key-name based rather than table based, so a personal-data column added to
-- any audited table is covered the moment it uses one of these names. Add
-- new names here when new personal-data columns are introduced.
-- ============================================================
create or replace function public.redact_audit_pii(payload jsonb)
returns jsonb
language plpgsql
immutable
set search_path = public
as $$
declare
  pii_keys text[] := array[
    'buyer_name', 'buyer_phone', 'buyer_email', 'message',
    'note', 'full_name', 'phone', 'email'
  ];
  k text;
begin
  if payload is null then
    return null;
  end if;

  foreach k in array pii_keys loop
    -- Only rewrite a key that exists and is not null: a NULL stays NULL so
    -- set/unset transitions remain visible in the trail.
    if payload ? k and jsonb_typeof(payload -> k) <> 'null' then
      payload := jsonb_set(payload, array[k], '"[redacted]"'::jsonb, false);
    end if;
  end loop;

  return payload;
end;
$$;

comment on function public.redact_audit_pii(jsonb) is
  'Replaces known personal-data values in an audit payload with a [redacted] marker while preserving NULL/!NULL distinction. Deliberately not a hash: small-keyspace values such as phone numbers would be reversible.';

-- ============================================================
-- 3. Trigger function: same name, same triggers, new body
-- ============================================================
create or replace function public.log_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_role text;
  v_actor_type text;
  v_before jsonb;
  v_after jsonb;
begin
  -- Read the request role from the JWT claims GUC. Unlike current_user this
  -- is unaffected by SECURITY DEFINER, which would otherwise report the
  -- function owner rather than the caller. Wrapped because the GUC may be
  -- absent or unparseable outside a PostgREST request.
  begin
    v_role := nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role';
  exception when others then
    v_role := null;
  end;

  v_actor_type := case
    when v_actor is not null then 'authenticated_user'
    when v_role = 'service_role' then 'service_role'
    when v_role = 'anon' then 'public_form'
    else 'system'
  end;

  v_before := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end;
  v_after  := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end;

  v_before := public.redact_audit_pii(v_before);
  v_after  := public.redact_audit_pii(v_after);

  insert into public.audit_log (
    actor_id, actor_type, action, table_name, record_id, before_data, after_data
  )
  values (
    v_actor,
    v_actor_type,
    lower(tg_op),
    tg_table_name,
    coalesce(new.id, old.id),
    v_before,
    v_after
  );

  return coalesce(new, old);
end;
$$;

-- Triggers are unchanged: properties_audit, leads_audit, deals_audit,
-- commission_ledger_audit, builders_audit, profiles_audit, invites_audit and
-- lead_notes_audit all call this function by name and pick up the new body
-- automatically. audit_log remains append-only — no UPDATE or DELETE policy
-- is added for any role, including super_admin.
