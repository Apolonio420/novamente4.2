-- =============================================================================
-- Ventas web de partners: pagos de oficio desde el admin + índices de idempotencia
-- 27/09/2026 — PLAN-PARTNER-VENTAS-PAYOUTS.md (decisiones de Juan)
--
-- Correr UNA vez en el SQL editor de Supabase (proyecto de producción).
-- Es idempotente (create ... if not exists / create or replace): re-correrlo no rompe.
-- Chequeado 27/09 con SELECTs: partner_orders tiene 3 filas y ninguna con
-- payment_id (el índice 1 se crea sin conflictos); partner_ledger_entries y
-- partner_payouts están vacías.
-- =============================================================================

-- 1) partner_orders: una fila por (partner, venta) ----------------------------
-- El bridge de ventas web (lib/partners/sale-effects.ts) busca antes de insertar;
-- este índice cierra la carrera de dos confirmaciones simultáneas del mismo pago.
-- (process-payment hacía upsert onConflict payment_id SIN índice → fallaba siempre.)
create unique index if not exists partner_orders_tenant_payment_uniq
  on partner_orders (tenant_id, payment_id)
  where payment_id is not null;

-- 2) Reverso por reembolso: uno por (partner, pedido) ---------------------------
-- Un carrito puede mezclar productos de dos partners → dos créditos por pedido.
-- El índice viejo (order_id, source) solo permitía revertir UNO de los dos.
drop index if exists partner_ledger_entries_order_refund_uniq;
create unique index if not exists partner_ledger_entries_order_refund_tenant_uniq
  on partner_ledger_entries (tenant_id, order_id)
  where source = 'order_refund';

-- 3) Pago de oficio registrado por un admin ------------------------------------
-- Juan transfiere al alias/CBU del partner y lo registra acá: crea el payout YA
-- pagado + su débito en el ledger, en UNA transacción, con el nro. de operación,
-- la fecha y quién lo registró (auditoría). Mismo lock por tenant que
-- partner_request_payout (serializa con retiros concurrentes) e idempotente por
-- p_idempotency_key (un doble click no paga dos veces). No deja pagar más que el
-- saldo disponible (créditos confirmados − débitos).
create or replace function partner_admin_record_payout(
  p_tenant_id uuid,
  p_amount numeric,
  p_reference text,
  p_paid_at timestamptz,
  p_admin_email text,
  p_idempotency_key text,
  p_notes text default null
) returns jsonb
language plpgsql
as $$
declare
  v_existing   partner_payouts%rowtype;
  v_available  numeric;
  v_payout_id  uuid;
  v_paid_at    timestamptz := coalesce(p_paid_at, now());
begin
  if p_amount is null or p_amount <= 0 or p_amount <> round(p_amount) then
    return jsonb_build_object('ok', false, 'error', 'invalid_amount');
  end if;
  if p_reference is null or btrim(p_reference) = '' then
    return jsonb_build_object('ok', false, 'error', 'missing_reference');
  end if;
  if p_admin_email is null or btrim(p_admin_email) = '' then
    return jsonb_build_object('ok', false, 'error', 'missing_admin');
  end if;
  if p_idempotency_key is null or btrim(p_idempotency_key) = '' then
    return jsonb_build_object('ok', false, 'error', 'missing_idempotency_key');
  end if;

  perform pg_advisory_xact_lock(hashtext('partner_payout:' || p_tenant_id::text)::bigint);

  select * into v_existing
    from partner_payouts
    where tenant_id = p_tenant_id and idempotency_key = p_idempotency_key
    limit 1;
  if found then
    return jsonb_build_object(
      'ok', true, 'idempotent', true,
      'payout_id', v_existing.id, 'status', v_existing.status);
  end if;

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

  insert into partner_payouts (
      tenant_id, amount, method, status, notes, requested_at, resolved_at, idempotency_key, metadata)
    values (
      p_tenant_id, p_amount, 'transferencia', 'paid', p_notes, now(), v_paid_at, p_idempotency_key,
      jsonb_build_object(
        'source', 'admin',
        'reference', btrim(p_reference),
        'paid_at', v_paid_at,
        'recorded_by', btrim(p_admin_email),
        'recorded_at', now()))
    returning id into v_payout_id;

  insert into partner_ledger_entries (tenant_id, payout_id, source, type, amount, concept, status, metadata)
    values (
      p_tenant_id, v_payout_id, 'payout', 'debit', p_amount,
      'Pago transferido por Novamente (op. ' || btrim(p_reference) || ')', 'confirmed',
      jsonb_build_object('reference', btrim(p_reference), 'paid_at', v_paid_at, 'recorded_by', btrim(p_admin_email)));

  return jsonb_build_object(
    'ok', true, 'idempotent', false,
    'payout_id', v_payout_id, 'available_after', v_available - p_amount);
end;
$$;

-- 4) Revisión de un crédito en needs_review -------------------------------------
-- Un crédito queda en revisión cuando el costo no se pudo resolver, el PVP quedó
-- por debajo del costo, la ganancia dio negativa o hubo un descuento raro. Un
-- admin lo aprueba (con el monto final) o lo anula (monto 0). Guarda el monto
-- original, quién y cuándo, y la nota. Solo sobre créditos web en needs_review.
create or replace function partner_admin_review_credit(
  p_entry_id uuid,
  p_amount numeric,
  p_admin_email text,
  p_note text default null
) returns jsonb
language plpgsql
as $$
declare
  v_entry partner_ledger_entries%rowtype;
begin
  if p_amount is null or p_amount < 0 or p_amount <> round(p_amount) then
    return jsonb_build_object('ok', false, 'error', 'invalid_amount');
  end if;
  if p_admin_email is null or btrim(p_admin_email) = '' then
    return jsonb_build_object('ok', false, 'error', 'missing_admin');
  end if;

  select * into v_entry from partner_ledger_entries where id = p_entry_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;
  if v_entry.type <> 'credit' or v_entry.source <> 'web_order' then
    return jsonb_build_object('ok', false, 'error', 'not_a_web_credit');
  end if;
  if coalesce(v_entry.status, 'confirmed') <> 'needs_review' then
    return jsonb_build_object('ok', false, 'error', 'not_in_review', 'status', v_entry.status);
  end if;

  update partner_ledger_entries
    set amount = p_amount,
        status = 'confirmed',
        metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
          'review', jsonb_build_object(
            'original_amount', v_entry.amount,
            'approved_amount', p_amount,
            'reviewed_by', btrim(p_admin_email),
            'reviewed_at', now(),
            'note', p_note))
    where id = p_entry_id;

  return jsonb_build_object('ok', true, 'entry_id', p_entry_id, 'amount', p_amount);
end;
$$;

-- 5) Permisos: solo service_role (mismo criterio que 20260623_partner_finance_rls_and_rpc_access.sql)
revoke execute on function partner_admin_record_payout(uuid, numeric, text, timestamptz, text, text, text)
  from public, anon, authenticated;
grant execute on function partner_admin_record_payout(uuid, numeric, text, timestamptz, text, text, text)
  to service_role;
revoke execute on function partner_admin_review_credit(uuid, numeric, text, text)
  from public, anon, authenticated;
grant execute on function partner_admin_review_credit(uuid, numeric, text, text)
  to service_role;

-- 6) Verificación manual (opcional) ------------------------------------------------
-- select indexname from pg_indexes where tablename in ('partner_orders','partner_ledger_entries');
-- select proname from pg_proc where proname like 'partner_admin_%';
