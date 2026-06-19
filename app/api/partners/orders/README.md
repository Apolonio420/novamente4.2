# Carga de pedidos del partner (manual + IA) — operación

Flujo: el partner pega texto en `/workspace/orders` → `POST /api/partners/orders/parse`
(Gemini) → revisa/edita → `POST /api/partners/orders`. Si marca **"Producir con
Novamente"**, el repo llama server-to-server a platform-master
`/api/partners/orders/submit`, que es el único que calcula/guarda el **costo del
proveedor y el margen** (nunca viven en este repo).

## Regla de no-filtración
- `partner_orders` y todas las APIs cara al partner solo guardan/devuelven
  PVP + precio partner. **Nunca** costo del proveedor ni margen.
- El costo lo computa platform-master (tabla `supplier_costs`) y lo guarda en
  `whatsapp_orders.metadata` (interno). La respuesta a este repo es solo
  `{ ok, pedido_numero }`.

## Variables de entorno

Repo 4.2 (workspace — Vercel proyecto del storefront/workspace):
- `GEMINI_API_KEY` — parser de texto (ya configurada).
- `RESEND_API_KEY`, `RESEND_FROM` — email al partner (ya configuradas).
- `TELEGRAM_BOT_TOKEN_SALES`, `TELEGRAM_CHAT_ID_SALES` — aviso al equipo (registro sin producción).
- **`PLATFORM_API_BASE_URL`** — base del admin, ej. `https://admin.novamente.ar` (NUEVA).
- **`BOT_API_SECRET`** — mismo secreto que platform-master (NUEVA en este repo).

Repo platform-master (admin):
- `BOT_API_SECRET` — autentica la llamada del workspace (ya existe para el bot).
- `PEDIDOS_WEBHOOK_URL`, `PEDIDOS_WEBHOOK_SECRET` — Apps Script de producción (ya existen).
- `TELEGRAM_BOT_TOKEN_SALES`, `TELEGRAM_CHAT_ID_SALES` — aviso al equipo con economía completa.

## Migraciones
Ninguna obligatoria. `partner_orders.source` y el flag `produce` se guardan en
`shipping_info` (JSONB existente). La economía interna se guarda en
`whatsapp_orders.metadata` (JSONB existente) en platform-master.
