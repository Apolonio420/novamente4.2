# Audit — MercadoPago Webhook → Orders

**Fecha**: 2026-05-18
**Repo**: novamente4.2 (web pública)
**Supabase**: fvsjvvyohaarivametxq
**Autor**: Claude (read-only audit, sin cambios de código)

---

## ⚠️ Mismatch crítico con el supuesto inicial

El reporte original asume tabla **`whatsapp_orders`** con columnas `mp_payment_id` / `mp_preference_id`.

**En este repo no existe esa tabla.** El checkout B2C escribe en una tabla llamada **`orders`**, con columnas:

| Esperado (admin) | Real (este repo)              |
| ---------------- | ----------------------------- |
| `whatsapp_orders`| `orders`                      |
| `mp_payment_id`  | `payment_id`                  |
| `mp_preference_id`| `mercado_pago_preference_id` |
| `payment_status` | `payment_status` ✅           |
| `payment_link`   | (no existe — el link se devuelve al cliente en `init_point` de la respuesta del checkout, no se persiste) |

**Implicancia**: la migración SQL que sambu corrió el 2026-05-18 probablemente se aplicó a la tabla equivocada o creó columnas que el código nunca toca. Hay que confirmar:
1. Sobre qué tabla se corrió la migración (`orders` o `whatsapp_orders`).
2. Si `whatsapp_orders` existe en el proyecto Supabase pero no en este repo, ¿de qué otro servicio viene? (¿bot de WhatsApp? ¿flujo legacy?)
3. Los **139 pedidos pending** que mencionás — ¿están en `orders` o en `whatsapp_orders`? Hay que confirmarlo con un `SELECT count(*) FROM orders WHERE payment_status='pending'` y comparar.

---

## 1. Findings — lo que SÍ existe en el repo

### 1.1 Endpoints de webhook

Hay **dos** webhooks de MercadoPago, separados por uso:

| Endpoint                                       | Uso                                | Archivo |
| ---------------------------------------------- | ---------------------------------- | ------- |
| `POST /api/webhooks/mercadopago`               | Compras B2C (carrito público)      | [app/api/webhooks/mercadopago/route.ts](../../app/api/webhooks/mercadopago/route.ts) |
| `POST /api/partners/webhook/mercadopago`       | Suscripciones de partners (planes) | [app/api/partners/webhook/mercadopago/route.ts](../../app/api/partners/webhook/mercadopago/route.ts) |

### 1.2 Flujo B2C

1. **Checkout** ([app/api/checkout/route.ts:122-187](../../app/api/checkout/route.ts)):
   - Crea fila en `orders` con `status='pending'`, `payment_status='pending'`, `external_reference='order_{timestamp}'`.
   - Crea preferencia en MP con ese `external_reference` y `notification_url` apuntando al webhook.
   - Update a la fila con `mercado_pago_preference_id` ([checkout/route.ts:209-211](../../app/api/checkout/route.ts)).
   - Devuelve `init_point` al cliente (el link de pago no se persiste).

2. **Webhook** ([app/api/webhooks/mercadopago/route.ts](../../app/api/webhooks/mercadopago/route.ts)):
   - Resuelve `payment_id` desde `body.data.id`, query `data.id`, o query `id` con `topic=payment` ([route.ts:15-28](../../app/api/webhooks/mercadopago/route.ts)).
   - Fetcha el pago a la API de MP para obtener `external_reference` ([route.ts:71-80](../../app/api/webhooks/mercadopago/route.ts)).
   - Busca la orden por `external_reference` y actualiza `payment_id`, `payment_status`, `status`, `metadata` ([route.ts:162-167](../../app/api/webhooks/mercadopago/route.ts)).
   - Mapeo de estados ([route.ts:118-142](../../app/api/webhooks/mercadopago/route.ts)):
     - `approved` → `payment_status='approved'`, `status='confirmed'`
     - `rejected|cancelled|refunded` → `status='cancelled'`
     - `pending|in_process|in_meditation` → ambos siguen `pending`
   - Idempotencia ([route.ts:108-112](../../app/api/webhooks/mercadopago/route.ts)): si la orden ya está `confirmed` con el mismo `payment_id`, sale temprano.
   - En `approved` dispara `notifySale()` (Telegram).

### 1.3 Eventos MP suscritos

El handler **solo procesa `payment`** (lo extrae con `topic=payment`). No procesa `merchant_order`, `chargeback`, `point_integration_wh`, etc.

---

## 2. Qué falta / problemas detectados

### A. La migración del admin probablemente apuntó a la tabla incorrecta
**Acción**: confirmar con sambu si `whatsapp_orders` existe en el proyecto Supabase `fvsjvvyohaarivametxq`. Si no existe → la migración debe rehacerse sobre `orders` (o entender de dónde vienen los 139 pending).

### B. No hay verificación de firma del webhook
MP envía un header `x-signature` con HMAC SHA256. El handler actual no lo valida → cualquiera puede postear al endpoint y forzar transiciones de estado.

### C. Solo eventos `payment` están suscritos
- Falta `merchant_order` (útil para reconciliar carritos con múltiples pagos).
- Falta `chargeback` (importante para reversiones).

### D. El `payment_link` (init_point) no se persiste
Si el comprador cierra la ventana, no podemos reenviarle el link. Conviene guardar `init_point` y/o `sandbox_init_point` en la fila de `orders`.

### E. Pedidos pending sin webhook hit
Si los 139 pending son reales en `orders`, posibles causas:
1. **Webhook URL mal configurada en MP** → confirmar en dashboard MP → Notificaciones → URL debe ser:
   ```
   https://<dominio-prod>/api/webhooks/mercadopago
   ```
   (reemplazar `<dominio-prod>` por el dominio real de Vercel/producción).
2. **Webhook devolvió 5xx** y MP dejó de reintentar.
3. **`external_reference` mismatch** entre lo que se guardó en checkout y lo que MP devuelve.
4. **Pagos abandonados** (cliente nunca completó el pago) — esto es normal y no es un bug.

---

## 3. Fix propuesto (sin implementar)

1. **Reconciliar la tabla de orders**:
   - Confirmar nombre real de tabla en producción (`orders` vs `whatsapp_orders`).
   - Alinear el admin para que lea de la tabla correcta (probablemente `orders`, no `partner_orders` — ver audit 2).

2. **Backfill de los 139 pending**:
   - Script one-off: por cada `order` pending con `mercado_pago_preference_id`, consultar MP API `/v1/payments/search?external_reference=...` y aplicar el mapeo de estados manualmente.

3. **Suscribir eventos faltantes en panel MP**:
   - Marcar `payment`, `merchant_order`, `chargeback` en la configuración de Webhooks.

4. **Persistir `init_point`** en la columna nueva `payment_link` (que la migración ya añadió).

5. **Agregar verificación de firma** (`x-signature` + `x-request-id` + secret) — esto es un fix de seguridad que conviene priorizar.

6. **Documentar la URL correcta** en `.env.example` o `README`:
   ```
   MERCADOPAGO_WEBHOOK_URL=https://<dominio-prod>/api/webhooks/mercadopago
   ```

---

## 4. Preguntas para sambu antes de implementar

1. ¿Existe `whatsapp_orders` en el proyecto Supabase `fvsjvvyohaarivametxq`? ¿O la migración se corrió contra `orders`?
2. ¿Cuál es el dominio de producción exacto? (para confirmar URL del webhook en MP).
3. Los 139 pending — ¿son todos recientes o hay un backlog de meses? Si hay un único cluster temporal, sugiere caída del webhook.
4. ¿Tenemos `MERCADOPAGO_WEBHOOK_SECRET` configurado en Vercel? (para implementar verificación de firma).
