# Review de caminos de plata — novamente4.2 (2026-07-03)

Workflow multi-agente Fable 5: 5 dimensiones × finder + verificador adversarial (sonnet). **22 hallazgos confirmados, 0 refutados**. main @ 73f6d46. Muchos son PRE-EXISTENTES (no del merge de ayer) — se marca cuando el verdict lo aclara.

> IMPORTANTE: los verdicts confirman que estos NO estan detras de los flags NEXT_PUBLIC_PARTNERS_* (esos solo tapan CRM/cockpit/fulfillment UI). El flujo de billing/subscribe y los webhooks estan LIVE en prod.

## [1] CRITICAL — Costo del proveedor (Dreamful) embebido en el bundle JS del workspace del partner

**Archivo**: `app/workspace/design-engine/page.tsx:15` · **Dimension**: contrato-cross-repo

**Escenario**: Cualquier partner (o cualquiera que descargue el chunk público de /_next/static de novamente.ar) abre el JS del workspace y lee los costos reales del proveedor de las 8 prendas (cost: 22670, 23470, 18100, 28170, 30170...). Con GROWTH_TIER_DELTA_ARS también en el bundle, deduce el margen exacto de Novamente sobre cada precio de plan y lo usa para negociar o ir directo a Dreamful. Viola la regla del README de orders ('el costo del proveedor y el margen nunca viven en este repo') y el comentario INNEGOCIABLE del propio archivo.

**Evidencia**: garment-pricing.ts:17 dice 'INNEGOCIABLE: nunca renderizar este valor en UI/API del lado del cliente', pero 4 archivos 'use client' importan los objetos completos con el campo cost: app/workspace/design-engine/page.tsx:15 (import ALL_GARMENT_PRICING, usado en 1151/1309/1513), app/workspace/catalog/page.tsx:31, components/workspace/MarginBreakdown.tsx:3, components/partners/storefront-designer.tsx:8 (GARMENT_PRICING). El tree-shaking no elimina campos de object literals: el mapa entero con cost viaja al navegador. El QMD log confirma que esto se corrigió solo para /b2b-precios-2026 ('el costo de producción ya NO viaja al bundle cliente — regla innegociable') pero el workspace quedó sin tocar.

**Fix sugerido**: Separar el campo `cost` (y cualquier dato derivado de margen) en un módulo server-only (`lib/partners/garment-pricing.server.ts`, sin 'use client' en ningún importador, idealmente marcado con `import 'server-only'`) que exponga solo funciones async (no el objeto crudo) consumibles desde Server Components o API routes. Los client components (design-engine, catalog, MarginBreakdown, storefront-designer) deben recibir los precios ya calculados (`on_demand`, `b2b_*`, `b2c_suggested`, `getPartnerPlanPrice()`, `getPlanMargin()`) vía una API route o server action que filtre `cost` antes de serializar la respuesta — nunca importar `ALL_GARMENT_PRICING`/`GARMENT_PRICING` completos en un archivo 'use client'. Añadir un test que falle si algún chunk de `.next/static` bajo `/workspace/` contiene el string `cost:` seguido de un número, similar a lo que ya se corrigió para `/b2b-precios-2026`.

---

## [2] CRITICAL — Partner puede inflar su margen acreditado (y retirarlo en plata) escribiendo metadata.cost_partner de su producto

**Archivo**: `lib/partners/ledger.ts:62` · **Dimension**: contrato-cross-repo

**Escenario**: Un partner con catalog:write hace PUT /api/partners/catalog/[id] con body { metadata: { cost_partner: 1, garmentKey: 'buzo-hoodie-unisex' } } — 'metadata' está en allowedFields sin validación de contenido. Cuando un cliente compra ese producto a $55.000 en su storefront (pago real por MercadoPago), process-payment.ts:255 llama creditOrderMargin, que resuelve el costo desde metadata.cost_partner=1 ANTES que el precio de plan confiable, y acredita $54.999 al ledger en vez de ~$24.700 (plan starter). El partner retira el saldo por POST /api/partners/finanzas. Novamente produce el buzo a costo real ($30.170) y encima paga el margen inflado: pérdida directa de dinero por cada venta.

**Evidencia**: ledger.ts:62-63: `const explicit = Number(meta.cost_partner ?? meta.cost_ars); if (Number.isFinite(explicit) && explicit > 0) return { cost: explicit, via: 'metadata.cost' }` — precedencia sobre getPartnerPlanPrice (línea 66-69). app/api/partners/catalog/[id]/route.ts:43-48 incluye 'metadata' en allowedFields y lo pasa a updateProduct sin sanitizar cost_partner/cost_ars/garmentKey. El único gate (validateProductForPublish) exige price > cost, que con cost=1 pasa trivialmente.

**Fix sugerido**: En ledger.ts:resolveItemCost, invertir la precedencia: usar SIEMPRE getPartnerPlanPrice(garmentKey, plan) como fuente de verdad del costo cuando garmentKey está resuelto, y tratar metadata.cost_partner/cost_ars como techo opcional (min(explicit, planPrice)) o eliminarlo directamente como fuente de costo — el partner nunca debería poder declarar su propio costo de producción, que es un dato que sólo Novamente conoce (plan pricing). Aplicar el mismo fix en variants.ts:resolveProductCost para que el gate de publicación tampoco confíe en cost_partner declarado por el partner. Alternativamente, mover el cálculo de costo enteramente a una tabla server-side (garment pricing por plan) y dejar de leer cost_partner/cost_ars de metadata en cualquier código de negocio (dejarlo sólo como campo informativo/display).

---

## [3] CRITICAL — Webhook de partners sin idempotencia ni firma: replay de un payment id viejo re-activa y extiende la suscripción gratis

**Archivo**: `novamente4.2/app/api/partners/webhook/mercadopago/route.ts:249` · **Dimension**: doble-cobro-races

**Escenario**: Un partner pagó el plan anual en enero y fue suspendido en junio por no renovar. Hace POST a /api/partners/webhook/mercadopago?topic=payment&id=<su_payment_id_de_enero> (el id figura en su comprobante de MP; el endpoint no valida x-signature — deuda ya documentada en docs/audits/mp-webhook-2026-05-18.md). El handler consulta el pago a MP, sigue 'approved' para siempre, external_reference matchea partner_sub_, y el branch approved corre completo otra vez: status='active', storefront_published=true, payment_failures=0 y subscription_expires_at = HOY + 1 año (calculateNewExpiration usa new Date(), línea 62-70). Renovación infinita gratis repitiendo el POST cada año. Además, los reintentos legítimos de MP (payment.updated) re-disparan Telegram y Meta CAPI duplicados porque, a diferencia del webhook de tienda, acá no hay ningún check de 'ya procesado'.

**Evidencia**: if (paymentDetails.status === 'approved') { ... const updated = await updateTenant(tenantId, { plan: paidPlan, status: 'active', ..., subscription_expires_at: subscriptionExpiresAt, payment_failures: 0 }) — no compara paymentId contra last payment procesado, no registra payment ids consumidos, y calculateNewExpiration() parte de new Date() en cada invocación.

**Fix sugerido**: Add a replay guard before the approved branch: track last processed payment id per tenant (e.g. tenant.metadata.last_mp_payment_id or a dedicated partner_payments table with a unique constraint on payment_id) and skip if paymentDetails.id was already applied — mirror the pattern already used in lib/payments/process-payment.ts:119-126. Also implement MP x-signature verification on this route (the audit already flags this for both webhooks) and consider deriving subscriptionExpiresAt from the payment's date_approved plus cycle rather than from new Date(), so a legitimate late-processed webhook doesn't grant extra free time either.

---

## [4] CRITICAL — createRecurringSubscription nunca cancela ni detecta un PreApproval activo previo: doble débito mensual real y cobros huérfanos

**Archivo**: `novamente4.2/lib/partners/subscription.ts:148` · **Dimension**: doble-cobro-races

**Escenario**: Partner con Growth recurrente activo (preapproval A debitando $25/mes) hace upgrade a Pro, o abre el checkout en dos pestañas y autoriza ambos init_points. Se crea preapproval B sin tocar A (grep en todo el repo: solo existen PreApproval.create y PreApproval.update para el bump de promo; no hay ningún cancel). MP debita A y B todos los meses = doble cobro real en la tarjeta. Peor: persistPendingSubscription pisa tenants.mp_subscription_id con B, así que cuando llega subscription_authorized_payment del preapproval A, handleAuthorizedPaymentEvent busca eq('mp_subscription_id', A) y no encuentra tenant (route.ts:144-152, solo loguea 'Authorized payment sin tenant') — el cobro de A queda invisible, sin registro ni reconciliación posible.

**Evidencia**: createRecurringSubscription hace `await new PreApproval(mpClient()).create({...})` y luego `persistPendingSubscription(tenantId, { preapprovalId: preapproval.id, ... })` que ejecuta `.update({ mp_subscription_id: args.preapprovalId, ... })` incondicionalmente; no hay lectura previa de tenant.mp_subscription_id ni llamada a cancelar el preapproval anterior en ninguna parte del repo.

**Fix sugerido**: Antes de crear el nuevo PreApproval en createRecurringSubscription: (1) leer tenant.mp_subscription_id y metadata.subscription_type actuales; (2) si ya existe uno activo/pending, llamar a new PreApproval(mpClient()).update({ id: existingId, body: { status: 'cancelled' } }) antes de crear el nuevo, o directamente reusar/actualizar el monto del existente en vez de crear uno nuevo (igual que ya hace bumpPromoToStandardIfDue para el cambio de precio); (3) hacer el update de mp_subscription_id en persistPendingSubscription condicional o al menos loguear/alertar (Telegram) cuando se detecta que se está reemplazando un id existente, para permitir reconciliación manual de los que ya quedaron huérfanos. Adicionalmente, en handleAuthorizedPaymentEvent, si no se encuentra tenant por mp_subscription_id, guardar el evento en una tabla de "cobros huérfanos" en vez de solo loguear, para poder auditar y reembolsar.

---

## [5] CRITICAL — El guard anti-doble-cobro traga los webhooks de refund/chargeback: la orden queda confirmada y el margen del partner queda acreditado

**Archivo**: `lib/payments/process-payment.ts:119` · **Dimension**: payouts-ledger

**Escenario**: Orden de storefront partner pagada → webhook 'approved' confirma la orden, setea payment_id y acredita el margen al ledger (creditOrderMargin, línea 255). Días después el cliente pide refund en MercadoPago. MP reenvía payment.updated con el MISMO payment_id ahora en status 'refunded'. El guard de idempotencia se evalúa ANTES de consultar el estado actual del pago: order.status==='confirmed' && order.payment_id===paymentId → return temprano 'already_confirmed'. El switch que mapea 'refunded'→cancelled (líneas 147-149) nunca se ejecuta. Resultado: la orden sigue 'confirmed' (se produce y envía una venta devuelta), el crédito de margen sigue en partner_ledger_entries, y el partner lo retira vía partner_request_payout — Novamente paga margen sobre una venta que devolvió. Plata perdida doble: producción + payout.

**Evidencia**: process-payment.ts:119 `if (order.status === "confirmed" && order.payment_id === String(paymentId)) { ... return { ok: true, reason: "already_confirmed", ... } }` — corre antes del switch de estados (línea 134) que contempla `case "refunded"`. El guard es del trabajo anti-doble-cobro reciente; el crédito al ledger es del partner foundation de hoy: nunca corrieron juntos.

**Fix sugerido**: Mover el guard de idempotencia para que compare contra el status FRESCO de MP, no solo contra el payment_id: `if (order.status === 'confirmed' && order.payment_id === String(paymentId) && paymentDetails.status === 'approved') { return already_confirmed }`. Así, si paymentDetails.status es 'refunded'/'charged_back'/'cancelled', el flujo cae al switch (línea 134) y ejecuta la transición a 'cancelled', y debería además revertir el crédito de margen (nueva función tipo `reverseOrderMargin` llamada desde el case 'refunded'/agregar un case explícito para chargeback) antes de que el partner pueda retirarlo vía partner_request_payout.

---

## [6] CRITICAL — Cambio de plan / re-suscripción pisa mp_subscription_id y metadata.promo en la creación del checkout sin cancelar el PreApproval viejo: doble débito y cobros sin registrar

**Archivo**: `novamente4.2/lib/partners/subscription.ts:194` · **Dimension**: promo-billing

**Escenario**: Partner en Growth promo activa (PreApproval debitando US$25/mes, metadata.promo con lock de 12 meses). Hace upgrade a Pro mensual: createRecurringSubscription crea un PreApproval NUEVO y persistPendingSubscription escribe de inmediato mp_subscription_id = nuevo id y metadata.promo = null (Pro no es elegible), ANTES de que MP autorice y sin cancelar el PreApproval Growth viejo. Dos resultados: (a) si autoriza el Pro, MP sigue debitando el Growth de $25 además del Pro de $100 → doble cobro; y los eventos subscription_authorized_payment del PreApproval viejo ya no matchean mp_subscription_id (webhook línea 147: .eq('mp_subscription_id', ap.preapprovalId) → 'Authorized payment sin tenant') → MP cobra plata que el sistema nunca registra. (b) Si abandona el checkout de Pro, su promo lock quedó borrado pero el PreApproval Growth sigue debitando $25: promoExpired(null) siempre devuelve false → el cron nunca hace el bump a $50 → paga US$25 PARA SIEMPRE, y además sus débitos mensuales quedan huérfanos (mp_subscription_id apunta al PreApproval pending abandonado) → subscription_expires_at nunca se extiende.

**Evidencia**: subscription.ts:194-197: `await db().from('tenants').update({ mp_subscription_id: args.preapprovalId, billing_cycle: 'monthly', metadata, ... })` — se ejecuta al crear el checkout (no al autorizar), con `metadata.promo = args.promo` (null para Pro o cupo lleno). No hay ningún `PreApproval.update({ status: 'cancelled' })` en lib/partners (grep confirma: el único PreApproval.update es el bump de monto en bumpPromoToStandardIfDue:292).

**Fix sugerido**: In createRecurringSubscription (subscription.ts), before creating the new PreApproval: if tenant already has metadata.subscription_type === 'recurring' and a mp_subscription_id, first call PreApproval.update({id: oldId, body: {status: 'cancelled'}}) (or fetch its current status and skip if already cancelled/paused) and only then create the new one and persist. Additionally, persistPendingSubscription should not overwrite mp_subscription_id/metadata.promo until the webhook confirms authorization — store the new preapproval id under a separate pending_mp_subscription_id field and only promote it to mp_subscription_id in activateRecurringTenant, so an abandoned checkout never clobbers a live, still-billing subscription's tracking fields.

---

## [7] HIGH — produce=true dispara producción real con precio_partner inyectable (0 permitido) sin piso ni verificación de pago

**Archivo**: `app/api/partners/orders/route.ts:44` · **Dimension**: contrato-cross-repo

**Escenario**: Un operator de cualquier tenant hace POST /api/partners/orders con produce=true y omite partner_price (default 0) o manda 1. 4.2 no valida contra getPartnerPlanPrice ni exige pago/crédito previo, y sendToProduction reenvía precio_partner=0 a platform. El submit de platform (novamente-platform/app/api/partners/orders/submit/route.ts) también acepta min(0).default(0), manda el pedido al Apps Script de producción PRIMERO (línea 212) y recién después persiste la economía: whatsapp_orders queda con margen_novamente = -costoTotal. Resultado: prendas producidas y despachadas sin que el partner transfiera nada; la única barrera es que un humano note el margen negativo en un mensaje de Telegram.

**Evidencia**: 4.2 orders/route.ts:44: `partner_price: z.number().min(0).optional().default(0)` sin cotejo contra el precio de plan (getPartnerPlanPrice existe en el repo y no se usa acá). platform submit/route.ts:51: mismo `precio_partner: z.number().min(0).optional().default(0)`; líneas 152-177 computan partnerTotal y margenNovamente desde el valor inyectado; el webhook de producción se dispara en línea 212 sin ninguna validación económica ni de pago previa.

**Fix sugerido**: En novamente4.2/app/api/partners/orders/route.ts, antes de aceptar produce=true: (1) calcular precio mínimo esperado por item vía getPartnerPlanPrice(garmentKey, tenant.plan) y rechazar (400) si partner_price < ese mínimo; (2) en novamente-platform/app/api/partners/orders/submit/route.ts, mover el insert a whatsapp_orders (con margenNovamente calculado) ANTES del fetch al Apps Script de producción (línea 212), y abortar con 402/403 si margenNovamente < 0 o si el tenant no tiene crédito/pago confirmado — no confiar únicamente en la notificación de Telegram como control.

---

## [8] HIGH — El PreApproval recurrente no lleva notification_url y el webhook de tienda descarta eventos de suscripción: activación depende de config externa, con riesgo de cobrar sin activar

**Archivo**: `novamente4.2/lib/partners/subscription.ts:149` · **Dimension**: doble-cobro-races

**Escenario**: Las Preferences sí fijan notification_url (checkout → /api/webhooks/mercadopago, anual partner → /api/partners/webhook/mercadopago), pero el PreApproval.create del flujo mensual no puede fijar URL: los eventos subscription_preapproval / subscription_authorized_payment van a la URL configurada a nivel aplicación en el dashboard de MP, y ambos flujos comparten el mismo MP_ACCESS_TOKEN (una sola app, una sola URL por tópico). Si esa URL apunta al webhook de tienda (el histórico), el evento llega a app/api/webhooks/mercadopago/route.ts:52, isPaymentEvent=false → 'Evento no-payment, ignorando' → 200. Resultado: el partner autoriza la tarjeta, MP empieza a debitar todos los meses, y el tenant NUNCA se activa (subscribe deliberadamente no cambia el plan: 'lo activa el webhook'). Cobrado sin servicio, todos los meses. El pago mensual también llega como topic=payment al webhook de tienda, que busca la orden por external_reference partner_sub_... → order_not_found → nada lo registra.

**Evidencia**: subscription.ts crea el PreApproval sin notification_url (el body solo tiene reason/external_reference/payer_email/back_url/status/auto_recurring); app/api/webhooks/mercadopago/route.ts:62-65 responde 200 e ignora todo body.type !== 'payment'; no existe en el repo nada que registre /api/partners/webhook/mercadopago para los tópicos de suscripción.

**Fix sugerido**: 1) Verificar/documentar en el dashboard de MP (Tu negocio > Configuración > Webhooks) que los tópicos subscription_preapproval y subscription_authorized_payment apunten a /api/partners/webhook/mercadopago, separado del tópico payment del checkout B2C (que puede seguir en el webhook viejo). 2) Agregar una prueba operacional: un cron/job que compare tenants con metadata.subscription_type='recurring' y pending_plan aún seteado (o sea, nunca activados) contra la antigüedad del preapproval_id — alertar si pasan >24-48h sin activar (posible cobro sin servicio). 3) Documentar en .env.example o README la URL exacta esperada por tópico, igual que se pidió en docs/audits/mp-webhook-2026-05-18.md para el caso B2C. 4) Considerar consultar periódicamente GET /preapproval/{id} desde un cron para reconciliar estados 'authorized' que el webhook no haya reportado (fallback igual al patrón ya usado en /api/payments/confirm para pagos B2C).

---

## [9] HIGH — persistPendingSubscription marca subscription_type='recurring' y pisa mp_subscription_id ANTES de que exista pago: un checkout abandonado desactiva la suspensión del cron para siempre

**Archivo**: `novamente4.2/lib/partners/subscription.ts:185` · **Dimension**: doble-cobro-races

**Escenario**: Partner anual (subscription_type='one_time') con la suscripción venciendo mañana entra a /api/partners/subscribe con billingCycle='monthly', recibe el init_point y abandona sin pagar. persistPendingSubscription ya escribió metadata.subscription_type='recurring' en el tenant. El cron check-subscriptions (route.ts:51) hace `if (metadata.subscription_type === 'recurring') continue` y nunca más lo suspende por vencimiento: servicio gratis indefinido con solo abrir el checkout una vez. El estado 'recurring' se persiste por la intención, no por el pago (el flujo anual, en cambio, solo escribe metadata si hay promo).

**Evidencia**: persistPendingSubscription: `metadata.subscription_type = 'recurring'; metadata.pending_plan = args.pendingPlan; ... .update({ mp_subscription_id: args.preapprovalId, billing_cycle: 'monthly', metadata, ... })` ejecutado dentro de createRecurringSubscription antes de cualquier autorización; cron check-subscriptions líneas 48-52 excluye a todo tenant 'recurring' de la suspensión.

**Fix sugerido**: Separar "intención de suscripción" de "suscripción confirmada": usar un campo distinto (ej. `metadata.subscription_type = 'recurring_pending'`) en persistPendingSubscription, y que activateRecurringTenant sea quien recién setee `'recurring'` al confirmarse `authorized` (ya lo hace en línea 210, es redundante pero correcto). Ajustar el cron (route.ts:51) para que el `continue` solo aplique a `'recurring'` confirmado, no a `'recurring_pending'` — así un pending viejo (ej. >48-72h sin autorizar) vuelve a caer en la lógica normal de vencimiento/suspensión. Alternativamente, agregar un job que consulte el estado real del PreApproval en MP para preapprovals `pending` con más de X horas y revierta el metadata si nunca se autorizó.

---

## [10] HIGH — Idempotencia marcada antes de los efectos: si el proceso muere entre confirmar la orden y acreditar el ledger, el margen del partner se pierde para siempre

**Archivo**: `novamente4.2/lib/payments/process-payment.ts:207` · **Dimension**: doble-cobro-races

**Escenario**: El webhook confirma una venta de tienda partner: PASO 6 (línea 207) escribe status='confirmed' + payment_id en la orden, y recién DESPUÉS corre el bridge a partner_orders, creditOrderMargin, el email al cliente y las notificaciones (líneas 216-390). Si la función serverless muere ahí (timeout de Vercel, deploy, OOM) — ventana real porque los efectos hacen varias llamadas de red — el reintento de MP y el fallback /api/payments/confirm entran por PASO 3 (línea 119): `order.status === 'confirmed' && order.payment_id === paymentId` → 'already_confirmed' → return SIN re-ejecutar efectos. El partner nunca recibe el crédito del margen en partner_ledger_entries (plata perdida para el partner), la orden nunca se puentea a partner_orders y el cliente no recibe el email. Todos los mecanismos de retry quedan neutralizados por la marca temprana.

**Evidencia**: PASO 3 (línea 119-129) retorna already_confirmed sin efectos; PASO 6 `updateOrder(order.id!, orderUpdates)` con status confirmed ocurre en línea 207, mientras creditOrderMargin recién en línea 255 y el bridge/email después — no hay flag por-efecto que permita reanudar.

**Fix sugerido**: Separar el escritura de estado en dos fases: (1) marcar la orden con un estado intermedio tipo 'payment_confirmed_pending_effects' (o guardar timestamps por-efecto en metadata: bridge_done_at, margin_credited_at, email_sent_at) ANTES de correr los side-effects, y (2) que el PASO 3 de idempotencia, en vez de cortar en seco cuando status==='confirmed', verifique cada guard individual y re-ejecute solo los efectos faltantes (patrón ya usado parcialmente con partner_notified_at y confirmation_email_sent_at, pero que hoy es inalcanzable por el corte temprano). Alternativa más simple: mover el `updateOrder` con status='confirmed' al FINAL, después de que todos los efectos corrieron (o al menos después del bridge+ledger que es la plata), y usar un campo separado tipo `payment_id` seteado desde el principio (sin status='confirmed') como marca de "ya estamos procesando este pago" para evitar carreras concurrentes sin bloquear el reintento de efectos.

---

## [11] HIGH — Carrera TOCTOU entre webhook y /api/payments/confirm: ambos leen la orden 'pending' y ejecutan los efectos dos veces

**Archivo**: `novamente4.2/lib/payments/process-payment.ts:119` · **Dimension**: doble-cobro-races

**Escenario**: MP notifica el webhook en el mismo instante en que redirige al cliente a la success page, que llama a /api/payments/confirm — ambas invocaciones de processPaymentById leen la orden con status='pending', pasan el check de PASO 3 (read-then-write, updateOrder es un UPDATE plano por id sin condición sobre status — lib/db.ts:1148) y corren el bloque de efectos completo en paralelo. notifySale (Telegram, línea 335) no tiene NINGÚN guard → siempre se duplica en esta carrera. Los guards de email al cliente y notificación al partner leen existingMetadata capturada al inicio (líneas 268 y 304) → ambos procesos la ven vacía y mandan doble email/doble aviso. Además los dos `updateOrder(order.id, { metadata: newMetadata })` escriben el objeto metadata completo desde lecturas stale: el segundo pisa el flag del primero (partner_notified_at o confirmation_email_sent_at se pierde), dejando la puerta abierta a más duplicados en reintentos posteriores. El ledger se salva solo por el unique index (23505) y CAPI por el event_id de Meta.

**Evidencia**: PASO 3: `if (order.status === 'confirmed' && order.payment_id === String(paymentId))` — check no atómico; updateOrder (lib/db.ts:1161-1164) es `.update(updateData).eq('id', orderId)` sin `.eq('status','pending')`; notifySale en línea 334-351 sin marca de deduplicación.

**Fix sugerido**: Serializar por orden: usar un advisory lock de Postgres (pg_advisory_xact_lock(hashtext(order.id))) al inicio de processPaymentById, o hacer el UPDATE condicional y atómico con .eq('status','pending') + .select() para detectar si realmente ganamos la carrera (0 filas afectadas = ya procesada por el otro proceso, salir temprano antes de correr efectos). Además, mover los guards de deduplicación (partner_notified_at, confirmation_email_sent_at, y agregar uno para notifySale, ej. sale_notified_at) a un UPDATE atómico tipo `UPDATE orders SET metadata = jsonb_set(metadata,...) WHERE id=... AND metadata->>'partner_notified_at' IS NULL RETURNING id` para que sea el UPDATE mismo el que decida si el efecto debe correr, en vez de leer-then-check en memoria con datos stale.

---

## [12] HIGH — No existe reverso de ledger ante refund: el crédito de margen es permanente aunque el pago se devuelva

**Archivo**: `lib/payments/process-payment.ts:147` · **Dimension**: payouts-ledger

**Escenario**: Aun en el camino donde el refund SÍ se procesa (p.ej. el evento 'approved' se perdió y el primer webhook que llega ya es 'refunded' tras un confirm fallback parcial, o si se arregla el guard del hallazgo anterior): el case 'refunded' solo cambia paymentStatus/orderStatus. En todo el repo el único escritor de débitos en partner_ledger_entries es la RPC partner_request_payout (retiros); no hay ninguna función que inserte un débito de reverso de margen por orden devuelta (grep de 'refund|chargeback' en *.ts devuelve solo el mapeo de estado y un type). El disponible del partner (SQL: SUM credits−debits en 20260622:72-80) sigue incluyendo el margen de la venta devuelta y es retirable.

**Evidencia**: process-payment.ts:147-149 `case "refunded": paymentStatus = "refunded"; orderStatus = "cancelled"` sin ningún efecto sobre partner_ledger_entries. Escritores del ledger en el repo: lib/partners/ledger.ts:137 (solo credits de margen) y la RPC partner_request_payout (solo debit de retiro). partner_orders tampoco se actualiza a refunded (upsert solo en rama approved, línea 244-246).

**Fix sugerido**: En el case 'refunded' (y 'cancelled' si aplica post-confirmación) de process-payment.ts, antes o después de updateOrder, buscar si existe un credit 'confirmed' en partner_ledger_entries para esa order_id y, si existe, insertar un debit compensatorio (source: 'order_refund', concept: 'Reverso margen por reembolso orden X') por el mismo monto — idealmente vía una función `reverseOrderMargin(orderId, tenantId)` simétrica a `creditOrderMargin`, con manejo de idempotencia (evitar doble reverso si el webhook llega más de una vez) y considerando el caso de que el margen ya haya sido retirado (available podría quedar negativo, lo cual el negocio debe decidir cómo tratar — por ejemplo permitiendo balance negativo o marcando la entry para cobro manual).

---

## [13] HIGH — partner_resolve_payout no tiene ningún caller: la resolución real se hará con UPDATE manual y el rechazo no devuelve la plata al partner

**Archivo**: `migrations/20260622_partner_payout_transaction.sql:104` · **Dimension**: payouts-ledger

**Escenario**: Partner solicita retiro de $50.000 → se crea payout 'requested' + débito de $50.000 en el ledger. La notificación de Telegram (app/api/partners/finanzas/route.ts:88) instruye al equipo 'Transferir y marcar pagado', pero NO existe ninguna ruta admin, UI ni script que invoque partner_resolve_payout (grep en app/ y lib/ = cero call sites; solo aparece en migraciones, docs y el script de staging que no la llama). El admin inevitablemente marcará el estado con un UPDATE directo en el dashboard de Supabase. Si marca 'rejected' a mano, el UPDATE salta el reverso que la RPC inserta (líneas 133-137): el débito de $50.000 queda en el ledger, el payout queda rejected, y el partner pierde $50.000 de saldo disponible de forma permanente y silenciosa. Además computeFinancials contaría $50.000 en 'rejected' (histórico) mientras available quedó descontado — el ledger y la vista se contradicen.

**Evidencia**: Grep de 'partner_resolve_payout' en todo el repo: matches solo en migrations/20260622 (definición), migrations/20260623 (grants), docs/reviews y docs/partners-os-rollout.md. Ningún .ts la invoca. La lógica de reverso vive exclusivamente dentro de la función: `if p_status = 'rejected' then insert into partner_ledger_entries (... 'payout_reversal', 'credit', v_payout.amount ...)`.

---

## [14] HIGH — El flujo mensual recurrente no exige primer pago para la promo: cualquier partner ya pago puede re-suscribirse y reiniciar 12 meses al 50%

**Archivo**: `novamente4.2/lib/partners/subscription.ts:138` · **Dimension**: promo-billing

**Escenario**: Partner Growth que ya pagó 11 meses de promo (o que viene pagando $50 full) cancela su suscripción y vuelve a suscribirse mensual. Mientras countPaidPartners < 100, isGrowthPromoEligible devuelve true sin mirar last_payment_at → nuevo PreApproval a US$25 y nuevo promo lock con expires_at = ahora + 12 meses. La promo 'primeros 100 que paguen, fija por 12 meses' se vuelve renovable indefinidamente por cancelar/re-suscribir: cada ciclo regala 12 meses más al 50%. El flujo anual sí lo protege (route.ts:86 `isFirstPayment && isGrowthPromoEligible`), el mensual no — inconsistencia directa entre las dos ramas mergeadas hoy.

**Evidencia**: subscription.ts:138: `const promoEligible = await isGrowthPromoEligible(plan)` (solo cupo, líneas 100-104 no consultan last_payment_at del tenant) vs app/api/partners/subscribe/route.ts:85-86: `const isFirstPayment = !tenant.last_payment_at; const promoEligible = isFirstPayment && (await isGrowthPromoEligible(typedPlan))`.

**Fix sugerido**: In createRecurringSubscription (or in the monthly branch of subscribe/route.ts before calling it), mirror the annual branch's guard: pass `isFirstPayment = !tenant.last_payment_at` in and only allow `isGrowthPromoEligible` to return true when `isFirstPayment` is also true, e.g. change subscription.ts:138 to `const promoEligible = !tenant.last_payment_at && (await isGrowthPromoEligible(plan))`, requiring tenant (or at least tenant.last_payment_at) to be passed into createRecurringSubscription's args. Also consider whether `billing/route.ts` cancel action should mark a permanent `metadata.promo_used = true` flag so even a tenant with a wiped/edited last_payment_at can't re-claim the promo.

---

## [15] HIGH — El bump de promo del cron dispara un webhook subscription_preapproval que re-ejecuta activateRecurringTenant: registra un pago que nunca ocurrió y regala +1 mes

**Archivo**: `novamente4.2/app/api/partners/webhook/mercadopago/route.ts:104` · **Dimension**: promo-billing

**Escenario**: Al vencer la promo, el cron llama bumpPromoToStandardIfDue → PreApproval.update(monto $50). MP notifica creación Y actualización de preapprovals por el topic subscription_preapproval; el webhook hace PreApproval.get, el status sigue siendo 'authorized' (la suscripción está activa) → entra a `if (status === 'authorized')` y ejecuta activateRecurringTenant de nuevo: last_payment_at = ahora, subscription_expires_at = ahora + 1 mes, payment_failures = 0 — sin que se haya movido un peso. Cada bump (y cualquier update/reintento de notificación de MP) fabrica un pago fantasma: corrompe last_payment_at (que gobierna el cupo vía countPaidPartners y la elegibilidad anual vía isFirstPayment), resetea el dunning y extiende acceso gratis. El registro del sistema deja de reflejar lo cobrado.

**Evidencia**: webhook route.ts:104-105: `if (status === 'authorized') { await activateRecurringTenant(tenant, id, now) }` sin idempotencia (no chequea si ya estaba activo ni distingue alta de update). subscription.ts:226-229: activateRecurringTenant siempre setea `subscription_expires_at: addMonths(nowISO, 1), last_payment_at: nowISO, payment_failures: 0`. El trigger es el propio cron: subscription.ts:292-301 (PreApproval.update de monto).

**Fix sugerido**: En handlePreapprovalEvent, hacer activateRecurringTenant idempotente: antes de re-otorgar el mes, verificar que sea realmente un alta (no un update de monto) — por ejemplo comparando si tenant.status ya es 'active' && tenant.mp_subscription_id === id && metadata.subscription_type === 'recurring', en cuyo caso solo actualizar metadata/plan sin tocar last_payment_at/subscription_expires_at/payment_failures. Idealmente, usar el evento subscription_authorized_payment (que sí representa un cobro real, vía getAuthorizedPayment) como única fuente de verdad para extender la fecha de expiración y last_payment_at, y limitar el manejo de 'authorized' en subscription_preapproval a la activación inicial (primera vez que el tenant pasa a recurring) o a reactivar tras 'cancelled'/'paused', nunca a refrescar fechas de pago en un tenant ya activo.

---

## [16] MEDIUM — Fallo de sendToProduction dentro de after() es silencioso: nadie de Novamente se entera y el partner cree que está en producción

**Archivo**: `app/api/partners/orders/route.ts:159` · **Dimension**: contrato-cross-repo

**Escenario**: PLATFORM_API_BASE_URL o BOT_API_SECRET sin configurar en Vercel (son env NUEVAS según el README), o platform caído/timeout de 25s: sendToProduction devuelve ok:false. El código solo hace console.error; la rama produce=true NO llama a notifyTeamManualSale ('el aviso al equipo lo manda platform-master' — que nunca recibió el pedido), no marca el pedido con excepción ni reintenta. Acto seguido notifyPartnerOrder se manda igual con produce:true y pedidoNumero undefined: el partner ve su pedido cargado 'para producir', el cliente final ya pagó al partner, y la prenda jamás entra a producción. Se detectaría recién a las 48h como pedido 'sin movimiento' en daily-attention, si alguien mira.

**Evidencia**: route.ts:158-162: `if (!prod.ok) { console.error('[POST /api/partners/orders] producción falló:', prod.error) } // El aviso al equipo con economía completa lo manda platform-master.` — y líneas 174-182 notifican al partner incondicionalmente con produce: body.produce. production.ts:47-48 devuelve ok:false si faltan las env, sin throw, por lo que ni siquiera hay error de Vercel.

**Fix sugerido**: En la rama `if (!prod.ok)` de route.ts:159-161: (a) llamar también a notifyTeamManualSale (o una variante "ALERTA: producción falló") con el error de prod.error, para que el equipo se entere igual sin depender de platform-master; (b) persistir el fallo en el pedido (ej. shipping_info.production_error o un status 'production_failed') para que aparezca en daily-attention inmediatamente en vez de a las 48h; (c) en notifyPartnerOrder, no afirmar "se envió a producción con Novamente" cuando prod.ok es false — pasar un flag `productionFailed` para que el email/telegram al partner refleje el estado real en vez de asumir éxito por `body.produce`.

---

## [17] MEDIUM — Canal a platform con BOT_API_SECRET compartido con el bot de WhatsApp y tenant_id sin verificar en el submit

**Archivo**: `lib/partners/production.ts:57` · **Dimension**: contrato-cross-repo

**Escenario**: El mismo secreto estático autentica el bot de WhatsApp (x-bot-secret en /api/webhooks/pedidos, según docs/partners-os/repo_audit.md:175) y ahora el workspace: un compromiso del repo/env del bot habilita a inyectar pedidos de 'partner' directo a la planilla de producción real. Además el submit de platform confía en tenant_id/tenant_name declarados por el caller sin verificar que el tenant exista: cualquier poseedor del secreto fabrica pedidos atribuidos a un tenant arbitrario o inexistente, produce prendas reales y ensucia la economía interna (whatsapp_orders.metadata). Tampoco hay nada que impida que PLATFORM_API_BASE_URL sea http:// y el bearer viaje en claro.

**Evidencia**: production.ts:52-57 manda `Authorization: Bearer ${secret}` con process.env.BOT_API_SECRET; README de orders línea 26: 'BOT_API_SECRET — autentica la llamada del workspace (ya existe para el bot)'. platform submit/route.ts:54-63: bodySchema acepta tenant_id: z.string().min(1).max(100) y en ningún punto del handler se consulta la tabla de tenants; isAuthorized (65-74) solo compara el bearer con safeEqual.

**Fix sugerido**: Emitir un secreto dedicado para el canal partner->platform (no compartir BOT_API_SECRET con el bot de WhatsApp) para poder rotar/revocar uno sin afectar al otro. En el endpoint submit de platform-master, validar tenant_id contra la tabla de tenants real antes de crear el pedido (404/400 si no existe), en vez de confiar en el tenant_name/id declarado por el caller. Forzar PLATFORM_API_BASE_URL a empezar con https:// (throw o log de alerta si no).

---

## [18] MEDIUM — Un segundo pago aprobado sobre la misma orden se absorbe en silencio: cliente cobrado dos veces sin detección ni alerta

**Archivo**: `novamente4.2/lib/payments/process-payment.ts:119` · **Dimension**: doble-cobro-races

**Escenario**: Cliente paga la preference, ve un error de red en el redirect y vuelve a pagar (o tenía dos pestañas del checkout de MP abiertas): llegan dos payments approved distintos con el mismo external_reference. El primero confirma la orden. El segundo entra a PASO 3 con payment_id distinto → el check `payment_id === String(paymentId)` NO matchea → sigue de largo, pisa order.payment_id con el segundo id y re-ejecuta el flujo. No hay detección de 'orden ya confirmada con OTRO pago aprobado', ni refund automático, ni alerta a Novamente: la plata extra del cliente queda cobrada y el rastro del primer payment_id se pierde de la columna (solo queda en metadata).

**Evidencia**: El único guard es `order.status === 'confirmed' && order.payment_id === String(paymentId)`; con paymentId distinto el flujo continúa y `orderUpdates.payment_id = String(paymentId)` sobreescribe el pago original sin ninguna rama que refunde o alerte el doble cobro.

**Fix sugerido**: In PASO 3, split the check: if order.status === "confirmed" and payment_id differs from the incoming approved paymentId, don't fall through silently — branch into a distinct "duplicate payment detected" path: log/alert (e.g. notifySale-style alert to Novamente ops with both payment_ids), persist the second payment_id into a JSON array/audit column (e.g. metadata.duplicate_payment_ids) instead of overwriting orders.payment_id, and optionally call MP's refund API automatically for the second payment_id. Also add a UNIQUE constraint on orders.payment_id (or a separate order_payments table) so double-writes are caught at the DB layer too.

---

## [19] MEDIUM — La renovación recalcula el vencimiento desde HOY, no desde el vencimiento vigente: el partner que renueva anticipado pierde el tiempo ya pagado

**Archivo**: `novamente4.2/app/api/partners/webhook/mercadopago/route.ts:62` · **Dimension**: doble-cobro-races

**Escenario**: Partner anual con subscription_expires_at al 2027-03-01 renueva el 2027-02-01 (un mes antes, empujado por el dunning del cron que avisa 3 días antes... o simplemente paga temprano). El webhook aprueba y setea subscription_expires_at = calculateNewExpiration('annual') = 2028-02-01 en vez de 2028-03-01: el partner paga 12 meses y recibe 11 — un mes de servicio pagado y perdido. Mismo patrón en registerRecurringCharge (subscription.ts:237-248: addMonths(nowISO, 1) desde la fecha de la notificación, no desde el expires_at vigente).

**Evidencia**: function calculateNewExpiration(billingCycle) { const now = new Date(); ... now.setFullYear(now.getFullYear() + 1) ... } — ignora tenant.subscription_expires_at; usado en línea 260 `const subscriptionExpiresAt = calculateNewExpiration(billingCycle)`.

**Fix sugerido**: En calculateNewExpiration (route.ts) y en activateRecurringTenant/registerRecurringCharge (subscription.ts), calcular la nueva fecha desde el máximo entre `now` y `tenant.subscription_expires_at` vigente: si expires_at > now, extender desde expires_at (renovación anticipada suma el período completo al tiempo restante); si expires_at <= now (ya vencido), extender desde now como hoy. Ej: `const base = tenant.subscription_expires_at && new Date(tenant.subscription_expires_at) > new Date(nowISO) ? tenant.subscription_expires_at : nowISO; addMonths(base, months)`. Aplica a los 3 call sites: route.ts:260, subscription.ts:227, subscription.ts:243.

---

## [20] MEDIUM — La promo Growth 50% mensual no exige primer pago: un partner que ya paga full puede cancelar y re-suscribirse a mitad de precio

**Archivo**: `novamente4.2/lib/partners/subscription.ts:100` · **Dimension**: doble-cobro-races

**Escenario**: El flujo ANUAL guarda la promo con `isFirstPayment && isGrowthPromoEligible` (subscribe/route.ts:86), pero el flujo MENSUAL llama isGrowthPromoEligible directo dentro de createRecurringSubscription (línea 138), que solo chequea plan==='growth' y cupo < 100. Un partner Growth que ya paga US$50/mes cancela su preapproval y vuelve a suscribirse: obtiene US$25/mes por 12 meses más, en loop cada vez que la promo se le vence — 50% de revenue perdido por partner que descubra el truco mientras haya cupo. Además countPaidPartners no es atómico: dos subscribes concurrentes en el slot 99/100 obtienen ambos la promo.

**Evidencia**: export async function isGrowthPromoEligible(plan) { if (plan !== 'growth') return false; const paid = await countPaidPartners(); return paid < GROWTH_PROMO.maxPartners } — sin chequeo de tenant.last_payment_at, a diferencia del branch anual (`const promoEligible = isFirstPayment && (await isGrowthPromoEligible(typedPlan))`).

**Fix sugerido**: Replicar el mismo patrón que el anual: cambiar `isGrowthPromoEligible(plan: PaidPlan)` para que reciba el tenant (o al menos `last_payment_at`), y en createRecurringSubscription calcular `const isFirstPayment = !tenant.last_payment_at` antes de llamar `isGrowthPromoEligible`, igual que subscribe/route.ts:85-86 hace para el anual (requiere pasar el tenant completo a createRecurringSubscription, no solo tenantId/tenantEmail). Además, considerar persistir `last_payment_at` (o un flag separado `ever_paid_at` que NUNCA se borre) para que cancelar/re-suscribirse no resetee la elegibilidad histórica — hoy ese campo no se limpia al cancelar así que ya sirve como señal, solo falta que el flujo mensual lo consulte. Para la race de countPaidPartners: envolver el chequeo+reserva en una transacción SQL atómica (p.ej. UPDATE con WHERE count<100 en una tabla de contador dedicada, o un unique constraint/advisory lock en Postgres) en vez de SELECT count seguido de un create desacoplado.

---

## [21] MEDIUM — Ventana cupo-lleno entre checkout y pago: el precio promo queda fijado en MP al crear el checkout, pero el cupo se consume recién con last_payment_at

**Archivo**: `novamente4.2/app/api/partners/subscribe/route.ts:86` · **Dimension**: promo-billing

**Escenario**: Con 95 partners pagos, 20 tenants crean checkout el mismo día: todos ven countPaidPartners()=95 < 100 → todos promoEligible, y el monto queda congelado en el PreApproval ($25/mes) o en la Preference anual ($255). Como el cupo solo se consume cuando el webhook setea last_payment_at, los 20 pueden autorizar/pagar durante los días siguientes → 115 partners con promo. No hay re-chequeo del cupo al momento del pago (el webhook activa cualquier payment approved / preapproval authorized sin revalidar elegibilidad) ni reconciliación posterior. Sobre-venta silenciosa del descuento: el sistema queda internamente consistente (metadata.promo coincide con lo cobrado) pero el cap de 100 se supera sin límite.

**Evidencia**: route.ts:86 y subscription.ts:138 chequean isGrowthPromoEligible solo al crear el checkout; countPaidPartners (subscription.ts:85-97) cuenta `last_payment_at NOT NULL`, que se setea recién en activateRecurringTenant:228 / webhook route.ts:274 al confirmarse el pago. El propio comentario en route.ts:101-102 reconoce que 'el cupo se consume recién con last_payment_at' pero nada valida el cupo del lado del cobro.

**Fix sugerido**: Revalidar el cupo en el momento de ACTIVAR el pago, no solo al crear el checkout: en el webhook (subscription_preapproval authorized y payment approved), antes de aplicar `meta.promo`/precio promo persistido, volver a llamar `countPaidPartners()` — si ya se llegó a 100, no honrar la promo prometida (bumpear a precio standard inmediatamente y notificar al tenant/soporte) en lugar de activar ciegamente lo que quedó fijado en MP. Alternativa más robusta: reservar el cupo de forma optimista al crear el checkout (ej. columna `promo_reserved_at` con upsert atómico limitado a 100 filas, o un contador atómico en DB) en vez de contar recién en el pago; liberar la reserva si el checkout expira sin pago (ej. tras 48-72h vía cron) para no quemar cupo con abandonos.

---

## [22] MEDIUM — Promo lock anual queda stale en metadata si el primer checkout se abandona y el segundo se hace a precio full: tenant paga $510 pero queda registrado con promo de $255

**Archivo**: `novamente4.2/app/api/partners/subscribe/route.ts:109` · **Dimension**: promo-billing

**Escenario**: Tenant elegible crea checkout anual Growth → se escribe metadata = { subscription_type: 'one_time', promo: { price_usd: 255, expires_at: checkout+365d } } ANTES de pagar. Abandona. El cupo se llena. Vuelve semanas después y crea otro checkout: promoEligible=false → promo=null → el guard `if (promo)` salta el updateTenant y la promo vieja queda intacta en metadata. Paga los $510 full, el webhook de payment approved (route.ts:264-278) activa el plan sin tocar metadata → el tenant queda cobrado a precio full pero con promo de $255 registrada — exactamente el estado 'paga full pero queda con promo en metadata'. Todo lo que lea metadata.promo (dashboard de billing, soporte, futuras reconciliaciones de precio) reporta que tiene 50% off vigente; si además luego pasa a mensual con subscription_type recurrente heredado mal, el cron podría interpretar un vencimiento de promo que nunca se cobró. El caso inverso también existe: el expires_at se ancla al momento del checkout, no del pago, así que un pago demorado acorta la promo registrada.

**Evidencia**: route.ts:103-117: `const promo = promoEligible ? {...} : null; if (promo) { await updateTenant(tenant.id, { metadata: { ...tenant.metadata, subscription_type: 'one_time', promo } }) }` — escribe antes del pago y nunca limpia en el camino no-elegible; el webhook de pago único (route.ts:264-278) no incluye `metadata` en el updateTenant, así que ni valida ni corrige el lock.

**Fix sugerido**: In app/api/partners/subscribe/route.ts, don't gate the metadata write on `if (promo)` — always reconcile: when promo is null/ineligible, explicitly clear any stale tenant.metadata.promo (and set subscription_type appropriately) before creating the new Preference, e.g. `await updateTenant(tenant.id, { metadata: { ...tenant.metadata, subscription_type: promo ? 'one_time' : (tenant.metadata?.subscription_type ?? 'one_time'), promo } })` unconditionally (writing `promo: null` when not eligible). Additionally, harden the webhook (app/api/partners/webhook/mercadopago/route.ts:264-278) to validate/overwrite metadata.promo against the actual paymentDetails.transaction_amount on approval — if the amount charged doesn't match metadata.promo.price_usd, clear or correct the promo lock there as a second line of defense. Also consider deriving expires_at from the payment confirmation timestamp (webhook) rather than checkout creation time (route.ts:106) to avoid shortening promo windows on delayed payments.

---

