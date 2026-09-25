-- Pinnacl Properties — STAGE 1 / J7
-- Extend redact_audit_pii() to cover source_parties.display_name and
-- project_duplicate_candidates.resolution_note
--
-- WHY: source_parties.display_name may be a natural person's name for an
-- individual broker or referrer. Without this change, every insert or update
-- to source_parties would copy that name verbatim into public.audit_log — a
-- table that deliberately has no UPDATE or DELETE policy for any role. That
-- would reintroduce exactly the "personal data in an unerasable store"
-- problem the Stage 0 migration closed.
--
-- This replaces the function body only. log_audit_event() calls
-- redact_audit_pii() by name and is unchanged, as are all audit triggers.
--
-- SCOPE: affects rows written from now on. It does NOT rewrite existing
-- audit_log rows — retro-redaction would mean UPDATEing an append-only audit
-- table, which remains a separate, explicitly-authorised decision.
--
-- Naming convention this depends on: every free-text column added in Stage 1
-- is named `note` (singular), which the existing key list already covers.
-- A column named `notes` would silently bypass redaction. The one exception,
-- J6's project_duplicate_candidates.resolution_note, is listed explicitly.

create or replace function public.redact_audit_pii(payload jsonb)
returns jsonb
language plpgsql
immutable
set search_path = public
as $$
declare
  pii_keys text[] := array[
    'buyer_name', 'buyer_phone', 'buyer_email', 'message',
    'note', 'full_name', 'phone', 'email',
    -- Added in Stage 1 / J7:
    'display_name',
    -- J6 project_duplicate_candidates.resolution_note: free-text review
    -- input, and an exception to the `note` naming convention in the header.
    'resolution_note'
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
  'Replaces known personal-data values in an audit payload with a [redacted] marker while preserving NULL/!NULL distinction. Deliberately not a hash: small-keyspace values such as phone numbers would be reversible. Stage 1 added display_name and resolution_note.';
