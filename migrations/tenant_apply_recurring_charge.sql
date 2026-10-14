-- PENDIENTE - NO APLICADA. Hardening opcional del cobro recurrente (ver
-- lib/partners/subscription.ts, casUpdateTenant). Hoy la atomicidad es un
-- compare-and-swap en la app sobre (updated_at, subscription_expires_at): cubre
-- a todo escritor que bumpee updated_at. Esta función da atomicidad total en la
-- DB (fila bloqueada) y deja de depender de que cada escritor bumpee updated_at.
-- Para adoptarla: revisar/aplicar y hacer que registerRecurringCharge llame a
-- supabaseAdmin.rpc('tenant_apply_recurring_charge', ...). Sin probar contra DB.
create or replace function tenant_apply_recurring_charge(
  p_tenant_id uuid, p_now timestamptz, p_ap_id text
) returns text
language plpgsql as $$
declare
  t tenants%rowtype;
  ids jsonb;
  grace boolean;
begin
  select * into t from tenants where id = p_tenant_id for update;
  if not found then raise exception 'tenant % no existe', p_tenant_id; end if;
  ids := coalesce(t.metadata->'mp_authorized_payment_ids', '[]'::jsonb);
  if p_ap_id is not null and (ids ? p_ap_id or t.metadata->>'last_mp_authorized_payment_id' = p_ap_id) then
    return 'duplicate';
  end if;
  grace := coalesce((t.metadata->>'expiry_is_activation_grace')::boolean, false);
  update tenants set
    status = 'active',
    last_payment_at = p_now,
    payment_failures = 0,
    subscription_expires_at = case
      when grace or t.subscription_expires_at is null or t.subscription_expires_at <= p_now
        then p_now + interval '1 month'
      else t.subscription_expires_at + interval '1 month' end,
    metadata = (coalesce(t.metadata, '{}'::jsonb) - 'expiry_is_activation_grace')
      || case when p_ap_id is null then '{}'::jsonb else jsonb_build_object(
           'last_mp_authorized_payment_id', p_ap_id,
           'mp_authorized_payment_ids',
           (select coalesce(jsonb_agg(x order by n), '[]'::jsonb) from (
              select x, n from jsonb_array_elements(ids || to_jsonb(p_ap_id)) with ordinality e(x, n)
              order by n desc limit 12) s)) end,
    updated_at = p_now
  where id = p_tenant_id;
  return 'applied';
end $$;
