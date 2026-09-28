-- =============================================================================
-- Saldo a favor del partner: cobrar a crédito + usar el saldo en un pedido propio
-- 28/09/2026 — decisión Juan (caso Sponsors, NOV-20260926-9852: Patricio deja su
-- ganancia A CRÉDITO para una prenda propia).
--
-- Se aplica con: npx tsx scripts/apply-migration.ts migrations/20260928_partner_saldo_a_favor.sql
-- Idempotente (create ... if not exists / create or replace).
-- =============================================================================

-- 1) Idempotencia de movimientos manuales (ajustes y uso de crédito) ------------
-- La clave vive en metadata.idempotency_key: un doble click / re-ejecución no
-- duplica. Los ajustes viejos sin clave no entran en el índice.
create unique index if not exists partner_ledger_entries_manual_idem_uniq
  on partner_ledger_entries (tenant_id, (metadata->>'idempotency_key'))
  where source in ('adjustment', 'credit_applied')
    and metadata ? 'idempotency_key';

-- 2) Usar saldo a favor en un pedido propio del partner --------------------------
-- Débito 'credit_applied' con la referencia del pedido, motivo y quién lo
-- registró. No puede superar el saldo disponible (créditos confirmados −
-- débitos). Mismo lock por tenant que los pagos (serializa con pagos/retiros).
create or replace function partner_admin_apply_credit(
  p_tenant_id uuid,
  p_amount numeric,
  p_reference text,
  p_admin_email text,
  p_idempotency_key text,
  p_notes text default null
) returns jsonb
language plpgsql
as $$
declare
  v_existing   uuid;
  v_available  numeric;
  v_entry_id   uuid;
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

  select id into v_existing
    from partner_ledger_entries
    where tenant_id = p_tenant_id
      and source = 'credit_applied'
      and metadata->>'idempotency_key' = p_idempotency_key
    limit 1;
  if found then
    return jsonb_build_object('ok', true, 'idempotent', true, 'entry_id', v_existing);
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

  insert into partner_ledger_entries (tenant_id, source, type, amount, concept, status, metadata)
    values (
      p_tenant_id, 'credit_applied', 'debit', p_amount,
      'Saldo a favor usado en tu pedido ' || btrim(p_reference), 'confirmed',
      jsonb_build_object(
        'reference', btrim(p_reference),
        'notes', p_notes,
        'recorded_by', btrim(p_admin_email),
        'recorded_at', now(),
        'idempotency_key', btrim(p_idempotency_key)))
    returning id into v_entry_id;

  return jsonb_build_object(
    'ok', true, 'idempotent', false,
    'entry_id', v_entry_id, 'available_after', v_available - p_amount);
end;
$$;

-- 3) Cómo cobra cada partner: 'cash' (transferencia semanal, default) | 'credit' --
-- Se guarda en tenants.metadata.payout_mode con merge atómico (no pisa el resto
-- del jsonb) y queda quién/cuándo lo cambió.
create or replace function partner_admin_set_payout_mode(
  p_tenant_id uuid,
  p_mode text,
  p_admin_email text
) returns jsonb
language plpgsql
as $$
begin
  if p_mode not in ('cash', 'credit') then
    return jsonb_build_object('ok', false, 'error', 'invalid_mode');
  end if;
  if p_admin_email is null or btrim(p_admin_email) = '' then
    return jsonb_build_object('ok', false, 'error', 'missing_admin');
  end if;
  update tenants
    set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'payout_mode', p_mode,
      'payout_mode_changed_by', btrim(p_admin_email),
      'payout_mode_changed_at', now())
    where id = p_tenant_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;
  return jsonb_build_object('ok', true, 'mode', p_mode);
end;
$$;

-- 4) Permisos: solo service_role ---------------------------------------------------
revoke execute on function partner_admin_apply_credit(uuid, numeric, text, text, text, text)
  from public, anon, authenticated;
grant execute on function partner_admin_apply_credit(uuid, numeric, text, text, text, text)
  to service_role;
revoke execute on function partner_admin_set_payout_mode(uuid, text, text)
  from public, anon, authenticated;
grant execute on function partner_admin_set_payout_mode(uuid, text, text)
  to service_role;
