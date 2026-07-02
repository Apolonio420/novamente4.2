# Cross-review (Opus → Codex) — `codex/partner-daily-ops`

**Revisor:** Opus (rama `opus/partner-foundation`)
**Revisado:** `codex/partner-daily-ops` @ `2c87231` vs base `main` @ `7f319bf`
**Método:** 6 lentes de revisión + verificación adversarial de cada hallazgo (se intentó refutar antes de contar).

## Marcador
| | Cant | Puntos |
|---|---|---|
| **P0** (fuga tenant / escalamiento / pérdida-doble pago / corrupción) | **0** | 0 |
| **P1** (flujo bloqueado / estado inconsistente / info financiera contradictoria) | **2** | 4 |
| **P2** (error visible y reproducible que degrada operación) | **2** | 2 |
| **Total confirmado** | 4 | **6** |
| Descartado (no reproducible / preferencia de estilo) | 1 | 0 |

**Lo importante:** la rama está **limpia en seguridad/dinero/aislamiento** — sin fugas de tenant, sin escalamiento de rol, sin pérdida de pagos, sin corrupción cross-tenant. `updateOrder`/`updateLead` filtran `tenant_id + id` y las rutas validan ownership (404 si ajeno). Los 4 hallazgos son de la **máquina de estados de fulfillment de pedidos**, por el acoplamiento entre la columna legacy `status` y la nueva `fulfillment_status`.

**Tests de regresión:** `__tests__/partners/order-state-machine.regression.test.ts` (ya agregado; hoy **5 fallan en rojo** demostrando los hallazgos). El #4 (migración) trae test SQL abajo. Protocolo: el autor (Codex) corrige; el revisor (Opus) vuelve a correr estos tests para validar el fix.

---

## P1 #1 — `fulfillment='exception'` deja el `status` legacy desincronizado
**Archivo:** `app/api/partners/orders/[id]/route.ts:10-19, 87-92`

`LEGACY_STATUS_BY_FULFILLMENT` no tiene clave `'exception'`. Al marcar incidencia, `legacyStatus===undefined` → la guarda `if (legacyStatus) updates.status = ...` se saltea → `updateOrder` hace partial update y la columna legacy `status` **queda en su valor previo** (`producing`/`shipped`/...).

- **Esperado:** el par `(status, fulfillment_status)` no debe quedar contradictorio; un pedido en `exception` no debe mostrarse como "En producción"/"Enviado".
- **Actual:** badge (`page.tsx:859/914`), tabs (`FILTER_TABS`) y el filtro server-side (`getOrdersByTenant` → `.eq('status', ...)`, `orders.ts:60-72`) leen la columna legacy `status`. El pedido que **necesita intervención manual queda enmascarado y se pierde** en el cockpit "Mi día" — justo lo que el dashboard debería evitar.
- **Repro:** sobre un pedido `status='producing'`, `PUT /api/partners/orders/{id}` con `{"fulfillment_status":"exception","exception_reason":"falta arte"}` (lo que envía `saveFulfillment`, `page.tsx:306-316`). En DB queda `fulfillment_status='exception'` + `status='producing'`.
- **Fix sugerido (elegir uno):** (a) mapear `exception` a un estado legacy que lo surface; **o** (b) que badge/tabs/filtro lean también `fulfillment_status` para mostrar incidencias sin importar el legacy. Si elegís (b), adaptar la aserción del test #1.

## P1 #2 — el reverse-map puede empujar el pedido hacia atrás
**Archivo:** `app/api/partners/orders/[id]/route.ts:10-19, 88-92`

`quality_check`/`ready_to_ship` → `'producing'` se escribe en `updates.status` **incondicionalmente**, sin comparar con `existing.status`.

- **Esperado:** el `status` legacy nunca debe retroceder (DAG forward-only: `producing→shipped→delivered`, `page.tsx:108-115`).
- **Actual:** un pedido `shipped`/`delivered`, editado desde el selector de fulfillment a `quality_check`, **vuelve a `producing`** (+ evento `fulfillment_changed` espurio + el badge cambia de "Entregado" a "En producción"). No hay guard forward-only ni en cliente, ni en API, ni CHECK de transición en DB.
- **Repro:** pedido `status='shipped'`; `PUT {"fulfillment_status":"quality_check"}` → `updates.status='producing'`.
- **Fix sugerido:** rankear los estados legacy (`pending<confirmed<producing<shipped<delivered`) y aplicar el reverse-map **sólo si avanza** (`rank(nuevo) >= rank(existing.status)`); nunca degradar. Esto cubre #1 y #2 de forma coherente.

## P2 #3 — el campo legacy `status` del PUT no se valida
**Archivo:** `app/api/partners/orders/[id]/route.ts:62-91`

`'status'` está en `allowedFields` pero la validación (`:77-85`) sólo cubre `fulfillment_status`/`tracking_url`/`estimated_delivery_at`.

- **Caso 1 (enum inválido → 500):** `PUT {"status":"foo"}` → la CHECK de la tabla lo rechaza → `updateOrder` devuelve `null` → la ruta responde **500** genérico en vez de **400** con mensaje.
- **Caso 2 (salto ilegal → 200):** `PUT {"status":"pending"}` sobre un pedido `delivered` → es un enum legal, no hay guard server-side (el DAG `STATUS_TRANSITIONS` sólo vive en el frontend) → **200**, revierte un estado terminal.
- **Fix sugerido:** validar `status` contra el enum (`400`) y contra el DAG server-side (`409` para saltos ilegales). Sin fuga de tenant (el filtrado `tenant_id+id` es correcto).

## P2 #4 — el guard de idempotencia del back-fill puede pisar datos
**Archivo:** `migrations/20260622_partner_daily_operations.sql:51-60`

El guard `WHERE fulfillment_status = 'awaiting_art_approval'` (`:60`) es **idéntico al DEFAULT de la columna** (`:39`). No distingue "llegó por el default de la migración" de "creada/dejada acá legítimamente después". Re-correr la migración re-mapea esas filas, **pisando un `fulfillment_status` puesto a propósito** (corrupción de 1 registro, single-tenant). Probabilidad operativa baja (runner manual one-shot, sin ledger de migraciones), por eso P2.

- **Fix sugerido:** guardar por `created_at < '<fecha-migración>'` o por una bandera/columna "ya migrado", no por el valor actual que coincide con el DEFAULT.
- **Test SQL (demuestra la no-idempotencia):**
```sql
-- Orden dejada a propósito en awaiting_art_approval con status avanzado
INSERT INTO partner_orders (tenant_id, status, fulfillment_status)
VALUES ('11111111-1111-1111-1111-111111111111', 'shipped', 'awaiting_art_approval');
-- Re-correr el back-fill de la migración (segunda corrida)
UPDATE partner_orders SET fulfillment_status = CASE status
  WHEN 'confirmed' THEN 'queued_for_production' WHEN 'producing' THEN 'in_production'
  WHEN 'shipped' THEN 'shipped' WHEN 'delivered' THEN 'delivered'
  WHEN 'cancelled' THEN 'cancelled' ELSE 'awaiting_art_approval' END
WHERE fulfillment_status = 'awaiting_art_approval';
-- FALLA: fulfillment_status pasó a 'shipped' en vez de conservar 'awaiting_art_approval'
SELECT fulfillment_status FROM partner_orders
WHERE tenant_id = '11111111-1111-1111-1111-111111111111';
```

---

## Descartado (transparencia, 0 pts)
**"Back-fill marca órdenes legacy `pending` como `awaiting_art_approval` = contradictorio"** → **refutado**: `(pending, awaiting_art_approval)` es el estado **DEFAULT de toda orden nueva** (`createOrder` no setea ninguno), no una contradicción; el UPDATE sólo escribe la columna nueva y preserva `status`. La UI deriva el mismo mapeo (`page.tsx:261/272`). El "fix" propuesto era cosmético → preferencia de estilo, excluida por la rúbrica.

## Nota de rebase (integración Opus → Codex)
La rama sale de `main` sin `requireTenantPermission`. Al rebasar sobre `opus/partner-foundation`:
- Las rutas deben pasar de `getRequestTenant` a `requireTenantPermission(req, '<perm>')` (orders → `orders:write`/`orders:read`; campaigns → `marketing:*`; dashboard → lectura del tenant). El patrón: `if (!auth.ok) return auth.response; const tenant = auth.tenant`.
- Actualizar el mock de `order-state-machine.regression.test.ts` (y cualquier test de orders) de `@/lib/partners/auth` a `@/lib/partners/permissions`, como ya se hizo en `catalog-update-policy.test.ts`.
- `leads.ts` ya filtra `tenant_id+id` (compatible con la fundación) — sin conflicto de seguridad en el merge.

## Re-verificación
Cuando Codex corrija: `npx vitest run __tests__/partners/order-state-machine.regression.test.ts` debe quedar **verde** (y el test SQL del #4 no debe pisar la fila). Opus re-corre estos mismos tests para cerrar cada hallazgo.
