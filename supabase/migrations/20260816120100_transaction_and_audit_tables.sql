-- Pinnacl Properties — Curated Broker Network
-- Migration 2 of 3: Transaction & audit tables
-- (site_visits, deals, commission_ledger, audit_log)

-- ============================================================
-- 5. site_visits
-- Immutable history — see CLAUDE.md "Site Visit Logs". No
-- update/delete policy is ever granted (migration 3) — this
-- table is append-only by design, enforced at the RLS layer.
-- ============================================================
create table public.site_visits (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id),
  property_id uuid not null references public.properties(id),
  broker_id uuid not null references public.profiles(id),
  visit_date timestamptz not null,
  notes text,
  created_at timestamptz not null default now()
);

comment on table public.site_visits is
  'Append-only. No UPDATE/DELETE policy exists for any role — see CLAUDE.md: "Site visits are logged" as immutable history.';

create index site_visits_lead_id_idx on public.site_visits (lead_id);
create index site_visits_property_id_idx on public.site_visits (property_id);
create index site_visits_broker_id_idx on public.site_visits (broker_id);

-- ============================================================
-- 6. deals
-- Deal Attribution Workflow — Source Broker vs Closing Broker.
-- See CLAUDE.md "Deal Attribution Workflow": no manual ownership
-- transfer, both contributors recorded transparently.
-- ============================================================
create table public.deals (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id),
  lead_id uuid references public.leads(id),
  buyer_name text not null,
  source_broker_id uuid not null references public.profiles(id),
  closing_broker_id uuid not null references public.profiles(id),
  verification_status text not null default 'pending_admin_verification'
    check (verification_status in ('pending_admin_verification', 'verified', 'rejected')),
  closing_proof_url text,
  verified_by uuid references public.profiles(id),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.deals.closing_proof_url is
  'Closing proof required before any commission_ledger entry may reach payment_status = released — see CLAUDE.md Anti-Cheat Rules.';

create index deals_property_id_idx on public.deals (property_id);
create index deals_source_broker_id_idx on public.deals (source_broker_id);
create index deals_closing_broker_id_idx on public.deals (closing_broker_id);
create index deals_verification_status_idx on public.deals (verification_status);

create trigger deals_set_updated_at
  before update on public.deals
  for each row execute function public.set_updated_at();

-- ============================================================
-- 7. commission_ledger
-- See CLAUDE.md "Commission Ledger". Split percentages are NOT
-- hardcoded anywhere in this schema — gross/platform/broker
-- shares are recorded per-deal at the application layer using
-- whatever ratio was configured at the time. The CHECK constraint
-- below only guarantees the three shares always reconcile to the
-- gross figure; it does not encode any specific ratio.
-- ============================================================
create table public.commission_ledger (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id),
  property_id uuid not null references public.properties(id),
  buyer_name text not null,
  source_broker_id uuid not null references public.profiles(id),
  closing_broker_id uuid not null references public.profiles(id),
  gross_commission numeric not null check (gross_commission >= 0),
  platform_share numeric not null check (platform_share >= 0),
  source_broker_share numeric not null check (source_broker_share >= 0),
  closing_broker_share numeric not null check (closing_broker_share >= 0),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'verified', 'released')),
  released_date timestamptz,
  created_at timestamptz not null default now(),
  constraint commission_shares_reconcile
    check (platform_share + source_broker_share + closing_broker_share = gross_commission)
);

comment on table public.commission_ledger is
  'Immutable ledger. Brokers may only ever SELECT rows where they are source_broker_id or closing_broker_id — see RLS migration. Two broker-share columns (source + closing) rather than one, since the documented model always attributes two distinct brokers per deal.';

create index commission_ledger_deal_id_idx on public.commission_ledger (deal_id);
create index commission_ledger_source_broker_id_idx on public.commission_ledger (source_broker_id);
create index commission_ledger_closing_broker_id_idx on public.commission_ledger (closing_broker_id);
create index commission_ledger_payment_status_idx on public.commission_ledger (payment_status);

-- ============================================================
-- 8. audit_log
-- Immutable, admin-only-readable audit trail. Populated
-- exclusively by the trigger function below — no direct client
-- INSERT path exists, so there is nothing for a broker to spoof.
-- ============================================================
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null check (action in ('insert', 'update', 'delete')),
  table_name text not null,
  record_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

comment on table public.audit_log is
  'Append-only. No UPDATE/DELETE policy exists for any role, including super_admin — see CLAUDE.md: "Audit trail cannot be edited."';

create index audit_log_table_name_idx on public.audit_log (table_name);
create index audit_log_record_id_idx on public.audit_log (record_id);
create index audit_log_actor_id_idx on public.audit_log (actor_id);
create index audit_log_created_at_idx on public.audit_log (created_at);

-- ============================================================
-- Generic audit trigger, attached to every table where a change
-- matters for the anti-cheat/audit-trail requirement. SECURITY
-- DEFINER so it can write to audit_log even though no role is
-- ever granted direct INSERT on that table (see migration 3).
-- ============================================================
create or replace function public.log_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_log (actor_id, action, table_name, record_id, before_data, after_data)
  values (
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    coalesce(new.id, old.id),
    case when tg_op in ('update', 'delete') then to_jsonb(old) else null end,
    case when tg_op in ('insert', 'update') then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end;
$$;

create trigger properties_audit
  after insert or update or delete on public.properties
  for each row execute function public.log_audit_event();

create trigger leads_audit
  after insert or update or delete on public.leads
  for each row execute function public.log_audit_event();

create trigger deals_audit
  after insert or update or delete on public.deals
  for each row execute function public.log_audit_event();

create trigger commission_ledger_audit
  after insert or update or delete on public.commission_ledger
  for each row execute function public.log_audit_event();

create trigger builders_audit
  after insert or update or delete on public.builders
  for each row execute function public.log_audit_event();

create trigger profiles_audit
  after insert or update or delete on public.profiles
  for each row execute function public.log_audit_event();

-- site_visits and audit_log are intentionally not self-audited:
-- site_visits already is the log for its own domain, and
-- auditing the audit log would be circular.
