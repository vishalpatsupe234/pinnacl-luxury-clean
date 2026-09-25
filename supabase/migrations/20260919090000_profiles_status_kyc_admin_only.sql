-- Pinnacl Properties — AUD-01 fix: profiles self-update privilege escalation
--
-- Previous vulnerability: `profiles_update_own` (RLS, from
-- 20260816120200_row_level_security.sql) allows any authenticated
-- user to UPDATE their own profiles row via
--   using (id = auth.uid()) with check (id = auth.uid())
-- RLS cannot restrict individual columns, and the only compensating
-- trigger — enforce_profile_role_change_admin_only(), from
-- 20260816120000_core_tables.sql — validated `role` alone. Nothing
-- guarded `status` or `kyc_status`. A caller could therefore issue
-- a direct PATCH against `profiles` (their own session + the public
-- anon key, no special tooling) setting their own `status` to
-- 'active' — bypassing the manual Super Admin approval gate
-- entirely — or reversing a Super Admin's own 'suspended'/'rejected'
-- decision on themselves. Confirmed against the live database: the
-- deployed trigger function's body checked only
-- `new.role is distinct from old.role`.
--
-- Fix: extend the SAME existing SECURITY DEFINER trigger function
-- (identical name, so the existing `profiles_role_change_admin_only`
-- trigger picks up the new body automatically — no trigger
-- create/drop needed) to also guard `status` and `kyc_status` using
-- the same super_admin check already used for `role`. This is
-- additive only: a normal user's harmless self-updates (full_name,
-- phone) are completely untouched, since the guard only does
-- anything when one of the three protected columns actually
-- changes value (checked with `is distinct from`, so a NULL <->
-- NULL non-change is never mistaken for a change).
create or replace function public.enforce_profile_role_change_admin_only()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_is_super_admin boolean;
begin
  if new.role is distinct from old.role
     or new.status is distinct from old.status
     or new.kyc_status is distinct from old.kyc_status
  then
    caller_is_super_admin := exists (
      select 1 from public.profiles where id = auth.uid() and role = 'super_admin'
    );

    if not caller_is_super_admin then
      if new.role is distinct from old.role then
        raise exception 'Only super_admin may change a profile role';
      elsif new.status is distinct from old.status then
        raise exception 'Only super_admin may change a profile status';
      else
        raise exception 'Only super_admin may change profile kyc_status';
      end if;
    end if;
  end if;

  return new;
end;
$$;
