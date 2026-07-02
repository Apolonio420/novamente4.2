# Plan de integración ACTUALIZADO — opus+codex → main (2026-07-02)

Reemplaza operativamente a `INTEGRATION-rebase-codex-onto-opus.md` (22/6). Ejecutar día 2 del sprint (3/7). Base: main @ `5464591`, análisis por simulación `git merge-tree` del 2/7.

## Hallazgo estructural (simplifica todo)
**`codex/partner-daily-ops` ya contiene a `opus/partner-foundation` completo** (merge-base de ambas == tip de opus `7415f32`; el alineamiento está en `e6a50ee`, `31a3f8d`, `769d715`). Los 3 conflictos que predecía el plan del 22/6 ya están resueltos DENTRO de codex. El trabajo real es **(opus+codex) vs los 31 commits nuevos de main** (promo Growth 50%, anti doble-cobro, doble faz, compositor sharp evolucionado, self-service de pedidos).

## LA decisión de diseño (resolver ANTES de mergear): `app/api/partners/subscribe/route.ts`
- main `71a33a0`: persiste `plan`, `billing_cycle`, `subscription_expires_at` y `metadata.promo` (PromoLock del cupo de 100) **antes** del pago.
- opus `443080f`: `requireTenantPermission('billing:manage')`, borra deliberadamente toda persistencia pre-pago; el webhook de partners activa el plan leyendo `external_reference = partner_sub_{tenantId}_{ts}_{billingCycle}_{plan}` (regex en `app/api/partners/webhook/mercadopago/route.ts:38,49,55` ya tolera el sufijo).

**Resolución adoptada (2/7)** — combinar las dos intenciones:
1. **Activación post-webhook gana (diseño de opus)**: nunca persistir `plan`/`billing_cycle`/`subscription_expires_at` antes del pago confirmado. Evita tenants con plan activo sin haber pagado.
2. **El precio promo se decide pre-pago por necesidad** (MercadoPago cobra lo que dice la PreApproval): en subscribe, chequear `isGrowthPromoEligible` y armar la PreApproval con el precio con descuento.
3. **La reserva del cupo se mantiene pre-pago pero como LOCK liviano, no como plan**: persistir solo `metadata.promo = { lockedAt, cycle, price }` (la intención de main) SIN tocar los campos de plan. El webhook, al activar, confirma el lock (lo vuelve permanente). Locks sin pago confirmado expiran a las 48h (job o chequeo lazy en el conteo del cupo) para no quemar lugares con checkouts abandonados.
4. `external_reference` usa el formato nuevo de opus con el plan/cycle embebido; la promo viaja en metadata.
5. Reescribir `app/api/partners/subscribe/route.test.ts` (asume comportamiento opus puro) para cubrir promo + lock + activación post-webhook.
6. Validar con Juan antes de deployar: que el cupo funcione con locks expirables le cambia levemente la semántica de "primeros 100" (reserva al iniciar pago, no al pagar).

## Orden de operaciones (día 2)
0. `git fetch` + confirmar main no avanzó; avisar que no entren pushes durante el merge. Crear rama `integration/partner-foundation-daily-ops` desde main (NO mergear directo a main).
1. **Merge `opus/partner-foundation`** → 4 conflictos esperados:
   - `app/api/partners/subscribe/route.ts` — **CRÍTICO**, aplicar la resolución de arriba.
   - `app/partners/join/page.tsx` (alta): fusionar promo UI + contador + enhanced conversions (main) con gate de activación paga + selección de tenant (opus).
   - `app/api/partners/orders/route.ts` (media): cuerpo self-service de main + auth `requireTenantPermission` de opus.
   - `app/api/partners/settings/route.ts` (baja): combinar owner-only (opus) + cambios main.
   - Gate: `npx tsc --noEmit` 0 + `npx vitest run` verde.
2. **Merge `codex/partner-daily-ops`** → ~3 conflictos nuevos:
   - `app/workspace/orders/page.tsx` (alta): FUSIONAR cockpit daily-ops (codex) + self-service upload (main) — dos features, no elegir un lado.
   - `lib/partners/studio/composite.ts` y `app/api/storefront/[slug]/studio/mockup/route.ts`: **tomar main** (es la versión evolucionada del mismo cambio de codex `30a599e`).
   - Riesgo semántico sin conflicto git: `lib/partners/orders.ts` — verificar que la máquina de estados de fulfillment (codex `8a2b3dd`) acepte pedidos creados por self-service (main `e677cf7`). Test dirigido.
3. **Migraciones**: aplicar `migrations/20260622_partner_daily_operations.sql` (idempotente). Verificar (no re-aplicar a ciegas) que las 5 de opus ya estén en prod: payout_transaction, rls_tenant_aware, team_invites, variants_from_metadata, finance_rls_and_rpc_access. Main no agregó migraciones desde el 22/6 → cero colisión SQL.
4. **Verificación total**: tsc + vitest completa + `next build` + harness de staging de codex (`c31a677`) + **smoke E2E del flujo de pago con promo usando un pago de prueba de MercadoPago antes de deploy** (riesgo residual: anti-doble-cobro de main [webhook tienda] + activación post-pago de opus [webhook partners] + cupo promo nunca corrieron juntos).
5. Merge de la rama de integración a main con **feature flags de rollout (`304db99`) APAGADOS**; push; encender gradual con Juan mirando.

## Estimación
10-16 h total → cabe en el día 2 con margen al día 3. Subscribe+webhooks 3-5h (Fable), join 1.5-2h, workspace/orders 2-3h, resto mecánico (subagentes sonnet) 4-6h.
