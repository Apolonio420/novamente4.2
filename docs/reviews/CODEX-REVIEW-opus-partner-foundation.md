# Cross-review (Codex → Opus) — `opus/partner-foundation`

**Revisor:** Codex  
**Revisado:** `opus/partner-foundation` @ `9c0c527` contra `main` @ `7f319bf`  
**Método:** lectura adversarial de rutas, migraciones y contratos, más `npx tsc --noEmit` y `npm test` en el worktree de Opus (ambos verdes).

## Marcador inicial

| Severidad | Cantidad | Puntos |
|---|---:|---:|
| P0 | 8 | 24 |
| P1 | 5 | 10 |
| P2 | 2 | 2 |
| **Total confirmado** | **15** | **36** |

No se autoriza merge mientras existan los P0. Cada corrección necesita la prueba de regresión indicada y una nueva ejecución del revisor.

## Re-verificación — 2026-06-22

Todos los hallazgos de esta acta están **corregidos en código y re-verificados**
antes del rebase de Codex sobre Opus. Los fixes llegaron en `bff6115`,
`4944432`, `5654bec`, `8b4c6be`, `652042e`, `443080f`, `a425b2b` y
`7415f32`; el estado integrado pasó `npx tsc --noEmit` y `npm test`.

- P0-1/P0-2: onboarding y checkout ahora exigen el owner del tenant activo;
  la activación de planes pagos sólo ocurre tras webhook aprobado.
- P0-3/P0-4/P0-5/P0-6: RLS, rutas operativas y cancelación de reservas quedan
  tenant-scoped y con permiso explícito.
- P0-7/P0-8: la key de idempotencia es obligatoria y retiros/RPCs son
  backend-only; la UI conserva la key al reintentar una intención.
- P1-1/P1-2/P1-4/P1-5 y P2-1/P2-2: corregidos en catálogo/variantes,
  invitaciones y selector. P1-3 fue resuelto al integrar el badge `processing`
  en Finanzas.

**Puntaje abierto para integración: 0.** El marcador inicial se conserva como
registro honesto del primer review; no implica puntos pendientes. Falta aplicar
las migraciones a un entorno de staging y ejecutar las pruebas de dos tenants/
tres roles contra una base real antes de publicar.

## P0-1 — Onboarding muta cualquier tenant sin autenticación

- **Archivos:** `app/api/partners/onboarding/route.ts:22,130-141,164-168,201-203,222-233`.
- **Reproducción:** sin `Authorization`, enviar `POST` con `{ "step": 8, "tenantId": "<tenant-B>", "data": { "plan": "pro" } }`.
- **Esperado:** `401` sin sesión y `404` para un tenant ajeno; sólo un `owner` puede continuar esos pasos.
- **Actual:** `updateTenant` corre con service role, activa, publica y cambia el plan del tenant indicado por el body.
- **Prueba de regresión:** dos tenants; steps 2, 7, 8 y 9 anónimos contra B no cambian ningún campo de B.

## P0-2 — Suscripción anual habilita un plan antes de cobro y sin owner

- **Archivos:** `app/api/partners/subscribe/route.ts:25-27,101-110`.
- **Reproducción:** sin token, `POST { "tenantId": "<tenant-B>", "plan": "pro", "billingCycle": "annual" }`.
- **Esperado:** owner del tenant y activación exclusiva desde el webhook de Mercado Pago aprobado.
- **Actual:** persiste `plan`, ciclo y vencimiento antes de crear siquiera la preferencia de pago.
- **Prueba de regresión:** anónimo recibe `401`; aun el owner no ve el plan habilitado hasta simular pago aprobado.

## P0-3 — RLS deja los pedidos expuestos entre tenants

- **Archivos:** `migrations/20260622_partner_rls_tenant_aware.sql:47-70`; `migrations/create_partner_orders_table.sql:25-28`.
- **Reproducción:** JWT de tenant A hace `PATCH /rest/v1/partner_orders?id=eq.<pedido-B>` con `{ "status": "cancelled" }`.
- **Esperado:** cero filas visibles o afectadas fuera del tenant.
- **Actual:** `partner_orders` conserva `FOR ALL USING (true) WITH CHECK (true)` público, porque la migración RLS no lo toca.
- **Prueba de regresión:** con JWT A, `select`, `update` y `delete` sobre un pedido B deben devolver cero filas/denegación.

## P0-4 — RLS permite escalar roles por PostgREST

- **Archivo:** `migrations/20260622_partner_rls_tenant_aware.sql:79-111`.
- **Reproducción:** JWT `viewer` elimina/edita un producto propio vía Data API; JWT `operator` actualiza `tenants.plan` o datos bancarios.
- **Esperado:** viewer sólo lectura; operator no puede gestionar plan, banco, equipo ni retiros.
- **Actual:** las policies `FOR ALL TO authenticated` sólo verifican membership, no rol, y saltean `requireTenantPermission`.
- **Prueba de regresión:** matriz RLS real viewer/operator/owner; viewer no puede mutar, operator no puede editar columnas sensibles y owner usa el backend autorizado.

## P0-5 — Rutas de mutación conservan `getRequestTenant` y aceptan viewers

- **Archivos:** `app/api/partners/orders/route.ts:29-50`, `app/api/partners/orders/[id]/route.ts:28-57`, `app/api/partners/support/[ticketId]/route.ts:28-97`, `app/api/partners/reviews/route.ts:35-56`, `app/api/partners/assistant/super-action/route.ts:20-83`, entre otras.
- **Reproducción:** JWT viewer hace `PATCH /api/partners/reviews` con `{ "id": "<review-propia>", "status": "rejected" }`.
- **Esperado:** `403`, dado que viewer es sólo lectura.
- **Actual:** membership válida basta para mutar estados, tickets, pedidos o consumir créditos.
- **Prueba de regresión:** test parametrizado de mutaciones: viewer siempre `403`; operator sólo tiene 2xx en los dominios operativos permitidos.

## P0-6 — Cancelación de onboarding call no está tenant-scoped

- **Archivos:** `app/api/partners/onboarding-call/route.ts:107-128`; `lib/partners/onboarding-call.ts:66-75`.
- **Reproducción:** usuario A llama `DELETE /api/partners/onboarding-call?id=<booking-B>`.
- **Esperado:** `404` y la reserva B no cambia.
- **Actual:** `cancelBooking` filtra exclusivamente por `id` y cancela B.
- **Prueba de regresión:** dos tenants; el DELETE de A contra B afecta cero filas.

## P0-7 — Retiro sin `Idempotency-Key` puede duplicar pago

- **Archivos:** `app/api/partners/finanzas/route.ts:63`; `migrations/20260622_partner_payout_transaction.sql:20-24,34-95`.
- **Reproducción:** owner con saldo de $40.000 manda dos `POST` idénticos de $20.000 sin key.
- **Esperado:** el servidor exige una key estable o genera/preserva una por intención; hay un solo payout y débito.
- **Actual:** la key `NULL` es permitida por el índice parcial, por lo que ambos retiros se crean.
- **Prueba de regresión:** dos POST sin header contra saldo para un solo retiro crean como máximo un payout/débito.

## P0-8 — RPC financiera pública y tablas de dinero sin RLS

- **Archivos:** `migrations/20260622_partner_payout_transaction.sql:34-138`; `migrations/20260622_partner_rls_tenant_aware.sql:47-54`.
- **Reproducción:** JWT autenticado de B invoca `partner_request_payout` o `partner_resolve_payout` para un tenant/payout A mediante Data API.
- **Esperado:** sólo backend service role puede ejecutar las RPC; ledger y payouts tienen RLS tenant-aware.
- **Actual:** PostgreSQL concede `EXECUTE` a `PUBLIC` por defecto y la migración RLS omite ambas tablas.
- **Prueba de regresión:** JWT B recibe `permission denied`, no crea ni resuelve filas de A.

## P1-1 — Producto publicado puede quedar debajo del costo

- **Archivos:** `app/api/partners/catalog/[id]/route.ts:63-75`; `app/api/partners/catalog/bulk-price/route.ts:95-115`; `app/api/partners/catalog/[id]/variants/[variantId]/route.ts:10-20`.
- **Reproducción:** producto publicado con costo $10.000 y precio $20.000; actualizar sólo `{ "price": 1 }`.
- **Esperado:** `400` sin cambiar la publicación ni el precio efectivo bajo costo.
- **Actual:** el gate se ejecuta sólo si el payload vuelve a incluir `status: "published"`.
- **Prueba de regresión:** PATCH de precio/bulk/variante de un producto publicado debajo de costo devuelve `400` y no persiste.

## P1-2 — Back-fill de variantes abandona combinaciones faltantes

- **Archivo:** `migrations/20260622_partner_variants_from_metadata.sql:29-32`.
- **Reproducción:** metadata colores Negro/Blanco, talles M/L y una variante antigua Negro/M.
- **Esperado:** cuatro combinaciones al finalizar; la existente se conserva.
- **Actual:** la presencia de una variante salta el producto completo y sólo queda una.
- **Prueba de regresión:** fixture SQL anterior; la migración produce cuatro combinaciones y una segunda corrida no duplica.

## P1-3 — Estado financiero `processing` rompe la vista

- **Archivos:** `lib/partners/payouts.ts:160-163`; `app/workspace/finanzas/page.tsx:21-28,45-49`.
- **Reproducción:** GET de Finanzas devuelve un payout `{ status: "processing" }`.
- **Esperado:** badge “En proceso”, sin excepción.
- **Actual:** `PAYOUT_BADGE[p.status]` es `undefined` y el render falla.
- **Prueba de regresión:** RTL con payout processing renderiza el badge.

## P1-4 — RPC de invitaciones enumera usuarios

- **Archivo:** `migrations/20260622_partner_team_invites.sql:10-17`.
- **Reproducción:** anon/authenticated invoca `partner_find_user_by_email('persona@dominio')`.
- **Esperado:** permiso denegado fuera del backend autorizado.
- **Actual:** `SECURITY DEFINER` sin `REVOKE EXECUTE FROM PUBLIC` expone la existencia y UUID de cuentas.
- **Prueba de regresión:** anon/authenticated recibe `permission denied`; service role resuelve el usuario.

## P1-5 — Invitaciones pendientes no tienen camino de aceptación en UI

- **Archivos:** `app/api/partners/team/accept/route.ts:10-24`; `app/workspace/layout.tsx:193-220`.
- **Reproducción:** owner invita; el usuario invitado selecciona la membership pendiente.
- **Esperado:** CTA de aceptar, refresco de memberships y selección operativa.
- **Actual:** no hay consumidor UI del endpoint de aceptación; el selector conduce a un `404`.
- **Prueba de regresión:** E2E invite → login → aceptar → seleccionar tenant → API operativa `200`.

## P2-1 — GET de variantes ajenas retorna 200 en lugar de 404

- **Archivos:** `lib/partners/variants.ts:137-144`; `app/api/partners/catalog/[id]/variants/route.ts:10-15`.
- **Reproducción:** tenant B pide variantes de un producto A.
- **Esperado:** `404`, igual que recurso inexistente.
- **Actual:** `{ "variants": [] }` con `200`, incumpliendo el contrato de recursos ajenos.
- **Prueba de regresión:** ruta con producto ajeno retorna `404`.

## P2-2 — Selector multi-marca adjudica Admin y falla al filtrar

- **Archivos:** `app/workspace/layout.tsx:196-199,230-235`; `app/api/partners/tenants/route.ts:27-28`.
- **Reproducción:** usuario con dos memberships, sin email en la respuesta, escribe en “Buscar partner”.
- **Esperado:** selector estable y sin privilegios ficticios.
- **Actual:** toda membership habilita `isAdmin`; `t.email.toLowerCase()` lanza al no existir email.
- **Prueba de regresión:** UI desktop/mobile con dos memberships sin email; buscar no arroja excepción ni muestra Admin.
