# Integración — rebase de `codex/partner-daily-ops` sobre `opus/partner-foundation`

Estado previo (verificado): el cross-review cerró **0 P0, 2 P1, 2 P2** y Codex ya
corrigió los 4 en `b46fd4b` (re-verificado: regresión 5/5 verde sin debilitar
asserts, suite 188/188, tsc verde). Falta integrar ambas mitades.

Orden (del brief): **se integra Opus primero; Codex rebasea encima y adapta al
contrato final.** Base de integración = `opus/partner-foundation` @ `9c0c527`.

## A. Conflictos git reales (predichos con merge de prueba — exactamente 3)

### 1. `app/api/images/history/route.ts`  *(trivial)*
Ambas ramas arreglan el mismo error de tsc (`never[]`): Opus con `interface ImageRow`,
Codex con `interface ImageHistoryRow` (+ `query as any`). **Las dos compilan.**
→ **Resolución:** quedarse con UNA (recomiendo la de Codex, que además castea el
query). Borrar la otra. Sin diferencia funcional.

### 2. `lib/partners/leads.ts`
- Opus agregó `updateLeadStatus(tenantId, leadId, status)` (filtra `tenant_id+id`).
- Codex agregó `getLeadById`, `updateLead`, `getLeadActivities`, `addLeadActivity`
  (todas tenant-scoped) y **reemplazó** `updateLeadStatus` por `updateLead`.
→ **Resolución:** **tomar la versión de Codex** (CRM más rica, toda tenant-scoped).
  `updateLeadStatus` de Opus queda superado por `updateLead`. Acción sobre el test:
  actualizar `lib/partners/leads.test.ts` (Opus) para que pruebe `updateLead`
  (misma aserción: el UPDATE incluye `tenant_id`), **o** eliminarlo — la cobertura
  de aislamiento ya la da `__tests__/partners/lead-tenant-scope.test.ts`.

### 3. `app/api/partners/leads/[id]/route.ts`
- Opus: `requireTenantPermission('leads:write')` + `updateLeadStatus`.
- Codex: `getRequestTenant` + GET con actividades + PATCH con campos CRM
  (`assigned_user_id`, `next_action_at`, `estimated_value_ars`, etc.) — ya tenant-scoped.
→ **Resolución:** **quedarse con el cuerpo de Codex** (más completo) pero con el
  **auth de Opus**:
  - `import { requireTenantPermission } from '@/lib/partners/permissions'`
  - GET → `const auth = await requireTenantPermission(request, 'leads:read'); if (!auth.ok) return auth.response;` usar `auth.tenant.id`.
  - PATCH → `requireTenantPermission(request, 'leads:write')`; usar `auth.tenant.id` y `auth.userId`.
  - Reemplazar todo `result.tenant.id`→`auth.tenant.id`, `result.userId`→`auth.userId`,
    y `if (!result) …401` → `if (!auth.ok) return auth.response`.

## B. Adaptar al contrato (todas las rutas nuevas de Codex)

El contrato de la fundación: **toda mutación pasa por `requireTenantPermission` con
permiso explícito**. Las rutas que Codex agregó salen de `main` usando
`getRequestTenant`; migrarlas (patrón: `const auth = await requireTenantPermission(req, '<perm>'); if (!auth.ok) return auth.response; const tenant = auth.tenant`):

| Ruta | Handler | Permiso |
|---|---|---|
| `app/api/partners/orders/[id]/route.ts` | GET / PUT | `orders:read` / `orders:write` |
| `app/api/partners/campaigns/route.ts` | GET / POST | `marketing:read` / `marketing:write` |
| `app/api/partners/campaigns/[id]/route.ts` | (según método) | `marketing:read` / `marketing:write` |
| `app/api/partners/leads/[id]/notes/route.ts` | POST | `leads:write` |
| `app/api/partners/leads/list/route.ts` | GET | `leads:read` |
| `app/api/partners/dashboard/attention/route.ts` | GET | (lectura del tenant) `orders:read` o un permiso de lectura general |

`lib/partners/daily-attention.ts` ya recibe `tenantId` — mantener; sólo asegurar que
la ruta lo derive de `auth.tenant.id`.

## C. Tests a actualizar tras el swap de auth
Mismo patrón que ya aplicó Opus en `__tests__/partners/catalog-update-policy.test.ts`
(mockear `@/lib/partners/permissions` → `requireTenantPermission` devolviendo
`{ ok:true, tenant:{id,…}, role:'owner', userId, … }`):
- `__tests__/partners/lead-tenant-scope.test.ts` (hoy mockea `@/lib/partners/auth`).
- `__tests__/partners/order-state-machine.regression.test.ts` (mockea `@/lib/partners/auth`; tras migrar la ruta de orders, cambiar a `permissions`).
- Cualquier test nuevo de Codex sobre campaigns/notes/dashboard que mockee `getRequestTenant`.

`catalog-update-policy.test.ts` ya viene migrado desde Opus — no tocar.

## D. Verificación post-rebase (gate para avanzar a main)
```
npx tsc --noEmit            # 0 errores
npm test                    # toda la suite verde: tests de seguridad de Opus
                            # (permissions, leads, payouts, team, variants) +
                            # los de Codex (lead-tenant-scope, order-state-machine,
                            # daily-ops) deben pasar juntos
```
Migraciones de Opus YA aplicadas en prod (payout RPC, RLS tenant-aware, variants,
team). La de Codex (`20260622_partner_daily_operations.sql`, ya idempotente) hay que
aplicarla: `npx tsx scripts/apply-migration.ts migrations/20260622_partner_daily_operations.sql`.

Recién con tsc+suite verdes + las dos migraciones aplicadas se corre la **aceptación
final** (2 tenants/3 roles e2e, funnel onboarding→…→liquidación, feed/UTM) y se mergea
a `main` con feature flags para CRM/fulfillment/cockpit.
```

> Opus (revisor) puede re-correr `order-state-machine.regression.test.ts` y los tests
> de seguridad sobre el resultado integrado para cerrar la verificación.
