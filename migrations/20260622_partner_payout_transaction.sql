-- Partner payout (retiro) transactional RPC + idempotency.
--
-- Problem this fixes (P0, money):
--   The previous flow read the balance, then inserted a payout and a debit in
--   separate statements. Two concurrent requests could both pass the balance
--   check and both withdraw, driving the balance negative (double spend). There
--   was also no idempotency, so a retried request created duplicate payouts.
--
-- This migration is idempotent and preserves existing data: it only ADDs a
-- nullable column + index and (re)creates two functions. Existing payouts and
-- ledger entries are untouched.
--
-- Apply with: psql "$DATABASE_URL" -f migrations/20260622_partner_payout_transaction.sql
--   (or paste into the Supabase SQL editor).

-- 1) Idempotency key on payouts -------------------------------------------------
alter table partner_payouts
  add column if not exists idempotency_key text;

-- One payout per (tenant, idempotency_key). NULLs are unconstrained so legacy
-- rows and non-idempotent calls still work.
create unique index if not exists partner_payouts_tenant_idem_uniq
  on partner_payouts (tenant_id, idempotency_key)
  where idempotency_key is not null;

-- Defensive: the app already writes payout_id on reversal/debit entries.
alter table partner_ledger_entries
  add column if not exists payout_id uuid;

-- 2) Request a payout atomically ------------------------------------------------
-- Validates balance, creates the payout and its debit in a single transaction,
-- serialized per tenant via a transaction-scoped advisory lock. Idempotent on
-- p_idempotency_key. Amounts are integer ARS.
create or replace function partner_request_payout(
  p_tenant_id uuid,
  p_amount numeric,
  p_method text,
  p_idempotency_key text default null
) returns jsonb
language plpgsql
as $$
declare
  v_existing   partner_payouts%rowtype;
  v_available  numeric;
  v_payout_id  uuid;
begin
  if p_amount is null or p_amount <= 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid_amount');
  end if;

  -- Serialize concurrent withdrawals for THIS tenant. Released at txn end.
  perform pg_advisory_xact_lock(hashtext('partner_payout:' || p_tenant_id::text)::bigint);

  -- Idempotency check INSIDE the lock: a replay returns the original payout.
  if p_idempotency_key is not null then
    select * into v_existing
      from partner_payouts
      where tenant_id = p_tenant_id and idempotency_key = p_idempotency_key
      limit 1;
    if found then
      return jsonb_build_object(
        'ok', true, 'idempotent', true,
        'payout_id', v_existing.id, 'status', v_existing.status);
    end if;
  end if;

  -- Available balance: confirmed credits minus all debits. needs_review credits
  -- do NOT count as available (they are still pending confirmation).
  select coalesce(sum(
           case
             when type = 'credit' and coalesce(status, 'confirmed') <> 'needs_review' then amount
             when type = 'debit' then -amount
             else 0
           end), 0)
    into v_available
    from partner_ledger_entries
    where tenant_id = p_tenant_id;

  if p_amount > v_available then
    return jsonb_build_object('ok', false, 'error', 'insufficient_funds', 'available', v_available);
  end if;

  insert into partner_payouts (tenant_id, amount, method, status, idempotency_key)
    values (p_tenant_id, p_amount, p_method, 'requested', p_idempotency_key)
    returning id into v_payout_id;

  insert into partner_ledger_entries (tenant_id, payout_id, source, type, amount, concept, status)
    values (p_tenant_id, v_payout_id, 'payout', 'debit', p_amount,
            'Retiro solicitado a ' || coalesce(p_method, ''), 'confirmed');

  return jsonb_build_object(
    'ok', true, 'idempotent', false,
    'payout_id', v_payout_id, 'available_after', v_available - p_amount);
end;
$$;

-- 3) Resolve a payout (admin) ---------------------------------------------------
-- Transitions a payout to paid/rejected/processing. On 'rejected' it reverses
-- the debit (credits the amount back) so funds return to available balance.
-- Final states (paid/rejected) cannot be re-transitioned. Idempotent.
create or replace function partner_resolve_payout(
  p_payout_id uuid,
  p_status text
) returns jsonb
language plpgsql
as $$
declare
  v_payout partner_payouts%rowtype;
begin
  if p_status not in ('paid', 'rejected', 'processing') then
    return jsonb_build_object('ok', false, 'error', 'invalid_status');
  end if;

  select * into v_payout from partner_payouts where id = p_payout_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if v_payout.status = p_status then
    return jsonb_build_object('ok', true, 'idempotent', true, 'status', p_status);
  end if;
  if v_payout.status in ('paid', 'rejected') then
    return jsonb_build_object('ok', false, 'error', 'already_final', 'status', v_payout.status);
  end if;

  update partner_payouts
    set status = p_status, resolved_at = now()
    where id = p_payout_id;

  if p_status = 'rejected' then
    insert into partner_ledger_entries (tenant_id, payout_id, source, type, amount, concept, status)
      values (v_payout.tenant_id, v_payout.id, 'payout_reversal', 'credit', v_payout.amount,
              'Reverso de retiro rechazado', 'confirmed');
  end if;

  return jsonb_build_object('ok', true, 'idempotent', false, 'status', p_status);
end;
$$;

-- 4) Concurrency verification (run manually against the DB) ---------------------
-- With a tenant whose available balance is exactly one withdrawal, fire two
-- concurrent calls; exactly one must succeed:
--   SELECT partner_request_payout('<tenant>', 20000, 'alias', 'k1');  -- session A
--   SELECT partner_request_payout('<tenant>', 20000, 'alias', 'k2');  -- session B (concurrent)
-- Expect: one {ok:true}, one {ok:false, error:'insufficient_funds'}.
-- Idempotency: repeating the SAME key returns the SAME payout_id with idempotent:true.
