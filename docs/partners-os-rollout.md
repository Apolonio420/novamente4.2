# Partners OS 4.2 — runbook de staging y rollout

La rama candidata es `codex/partner-daily-ops`; incluye la fundación de Opus y
la operación diaria de Codex. No mergear a `main` ni habilitar los flags hasta
terminar esta lista contra una base de staging respaldada.

## Migraciones

1. Hacer backup verificable de las tablas `tenants`, `tenant_users`,
   `partner_*`, ledger y payouts.
2. Aplicar, en este orden:

   - `migrations/20260622_partner_rls_tenant_aware.sql`
   - `migrations/20260622_partner_team_invites.sql`
   - `migrations/20260622_partner_payout_transaction.sql`
   - `migrations/20260623_partner_finance_rls_and_rpc_access.sql`
   - `migrations/20260622_partner_variants_from_metadata.sql`
   - `migrations/20260622_partner_daily_operations.sql`

3. Verificar que las RPC `partner_request_payout` y `partner_resolve_payout`
   sólo sean ejecutables por `service_role`, y que `authenticated` no pueda
   mutar tablas partner directamente.

## Aceptación en staging

- Crear tenant A y B; crear owner, operator y viewer en A.
- Con JWT del viewer, intentar mutar catálogo, pedido, lead, retiro y equipo:
  cada acción debe responder `403` o afectar cero filas.
- Con JWT del operator, ejecutar catálogo, lead, pedido y soporte; intentar
  banco, billing, equipo y retiro: sólo las primeras deben pasar.
- Con JWT de A, leer/editar recursos de B: debe retornar `404` o cero filas.
- Acreditar saldo suficiente para un único retiro y disparar dos requests
  concurrentes con keys distintas: sólo uno puede crear payout/débito.
- Repetir el mismo retiro con la misma `Idempotency-Key`: debe devolver el
  mismo payout sin otro débito.
- Recorrer: onboarding → diseño → producto/variantes → lead → pedido →
  producción → tracking → liquidación visible.
- Validar feed y una campaña con UTM, visita, lead y compra atribuidos.

## Flags de despliegue

En producción, los tres flags empiezan apagados. En desarrollo se habilitan por
defecto, salvo que se los defina explícitamente como `false`.

- `NEXT_PUBLIC_PARTNERS_CRM_ENABLED=true`
- `NEXT_PUBLIC_PARTNERS_COCKPIT_ENABLED=true`
- `NEXT_PUBLIC_PARTNERS_FULFILLMENT_ENABLED=true`

Habilitar uno por vez tras su smoke test. Los fixes de seguridad y dinero no
dependen de flags y se liberan junto con sus migraciones verificadas.
