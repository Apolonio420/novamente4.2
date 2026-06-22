-- Financial tables and payout RPCs are backend-only.
--
-- The application calls these tables and functions with the Supabase service
-- role after requireTenantPermission() has checked the owner and active tenant.
-- Do not expose a second, direct PostgREST path to balances or withdrawals.

alter table partner_payouts enable row level security;
alter table partner_ledger_entries enable row level security;

drop policy if exists "Service role full access" on partner_payouts;
create policy "Service role full access" on partner_payouts
  for all to service_role using (true) with check (true);

drop policy if exists "Service role full access" on partner_ledger_entries;
create policy "Service role full access" on partner_ledger_entries
  for all to service_role using (true) with check (true);

-- Defense in depth: even if broad public-schema grants exist, browser roles
-- cannot read or mutate financial rows. The server uses service_role only.
revoke all on table partner_payouts from anon, authenticated;
revoke all on table partner_ledger_entries from anon, authenticated;
grant all on table partner_payouts to service_role;
grant all on table partner_ledger_entries to service_role;

-- PostgreSQL grants EXECUTE on new functions to PUBLIC by default. Restrict
-- both balance-changing procedures to the backend service role.
revoke execute on function partner_request_payout(uuid, numeric, text, text)
  from public, anon, authenticated;
revoke execute on function partner_resolve_payout(uuid, text)
  from public, anon, authenticated;
grant execute on function partner_request_payout(uuid, numeric, text, text)
  to service_role;
grant execute on function partner_resolve_payout(uuid, text)
  to service_role;
