# Audit — Tablas de Orders (B2B vs B2C)

**Fecha**: 2026-05-18
**Repo**: novamente4.2 (web pública)
**Supabase web**: fvsjvvyohaarivametxq
**Supabase admin**: ywsoqaclylvrbqfvwofr
**Autor**: Claude (read-only audit)

---

## TL;DR

El admin lee `partner_orders` y la encuentra vacía. **No es un bug del admin — es por diseño en este repo**: el checkout público escribe SIEMPRE en la tabla `orders` (B2C guest), nunca en `partner_orders`. `partner_orders` solo se llena vía funciones de `lib/partners/orders.ts`, que el checkout no invoca.

Además: **la tabla `whatsapp_orders` que mencionás no existe en el código de este repo.** O viene de otro servicio (bot WhatsApp), o el supuesto es incorrecto.

---

## 1. Tablas detectadas

| Tabla            | Proyecto Supabase | Quién escribe                                   | Discriminador B2B/B2C |
| ---------------- | ----------------- | ----------------------------------------------- | --------------------- |
| `orders`         | `fvsjvvyohaarivametxq` | [app/api/checkout/route.ts](../../app/api/checkout/route.ts), [app/api/webhooks/mercadopago/route.ts](../../app/api/webhooks/mercadopago/route.ts) vía [lib/db.ts:883-1008](../../lib/db.ts) | **Ninguno** — todas las compras del carrito público caen acá |
| `order_items`    | `fvsjvvyohaarivametxq` | [lib/db.ts:988-990](../../lib/db.ts) — items de cada order | N/A |
| `partner_orders` | `fvsjvvyohaarivametxq` (?) | Solo funciones en [lib/partners/orders.ts](../../lib/partners/orders.ts) — **no se llama desde el checkout público** | `tenant_id` (required) |
| `whatsapp_orders`| ❓ | **No referenciada en código** (`grep` vacío) | — |

---

## 2. Detalle por tabla

### 2.1 `orders` — B2C guest

INSERT en `createOrder()` ([lib/db.ts:883-1008](../../lib/db.ts)).

Columnas escritas:
```
order_number          (NOV-YYYYMMDD-XXXX, auto)
user_id               (nullable — guest checkout)
customer_email, customer_first_name, customer_last_name, customer_phone
shipping_address, shipping_city, shipping_postal_code
payment_method        ('mercadopago' hardcoded)
payment_status        ('pending' inicial)
payment_id            (lleno por webhook)
external_reference    ('order_{timestamp}')
mercado_pago_preference_id
subtotal, shipping_cost, total
currency              ('ARS')
status                ('pending' → 'confirmed' → 'shipped' → 'delivered' | 'cancelled')
items                 (JSON)
metadata              (JSON)
```

**No hay** `is_partner`, `user_type`, `tenant_id`, `partner_id`. Todo lo que cae acá es indistinguible entre B2C real y un partner que compró sin loguearse.

UPDATE vía `updateOrder()` ([lib/db.ts:1096-1125](../../lib/db.ts)) — usado solo por el webhook de MP.

### 2.2 `partner_orders` — destinada a B2B, pero el carrito público NO escribe acá

Definida en [lib/partners/orders.ts:5-96](../../lib/partners/orders.ts).

Columnas:
```
id, tenant_id (required)
customer_name, customer_email, customer_phone
items (JSON)
total, currency
status         ('pending' | 'confirmed' | 'producing' | 'shipped' | 'delivered' | 'cancelled')
payment_id, payment_status ('pending' | 'approved' | 'rejected' | 'refunded')
shipping_info (JSON), notes
```

Funciones disponibles:
- `getOrdersByTenant()` — query scoped por tenant
- `createOrder()` ([orders.ts:65-96](../../lib/partners/orders.ts)) — **nadie la invoca desde el flujo de carrito**
- `updateOrderStatus()`, `updateOrder()`

**Esto explica los 0 registros en el admin.** El checkout no diferencia y siempre llama a `lib/db.ts → createOrder()` (tabla `orders`), nunca a `lib/partners/orders.ts → createOrder()` (tabla `partner_orders`).

### 2.3 `whatsapp_orders` — no existe en este repo

`grep -rln whatsapp_orders app/ lib/` no devuelve resultados. Si existe en producción, viene de:
- Un servicio externo (¿bot WhatsApp en `app/api/webhooks/whatsapp/`?) — verificar.
- O fue creada manualmente y nunca se enganchó al código.

El directorio `app/api/webhooks/whatsapp/` existe — convendría leerlo antes de asumir.

---

## 3. Qué falta / qué decidir

Hay tres caminos posibles, **mutuamente excluyentes**:

### Opción A — El admin lee de `orders`, no de `partner_orders`
Como vos sospechás. Simplest fix: cambiar el query del admin para apuntar a `orders` en Supabase `fvsjvvyohaarivametxq`. Pero pierde la separación tenant.

**Problema**: si un partner compra desde su propio storefront, el admin no puede filtrar "solo mis ventas" porque no hay `tenant_id`.

### Opción B — Agregar `tenant_id` (nullable) a `orders` y discriminar post-facto
Migración:
```sql
ALTER TABLE orders ADD COLUMN tenant_id uuid REFERENCES tenants(id);
ALTER TABLE orders ADD COLUMN is_partner_sale boolean DEFAULT false;
CREATE INDEX idx_orders_tenant_id ON orders(tenant_id) WHERE tenant_id IS NOT NULL;
```

En el checkout, detectar si el comprador tiene sesión de partner (cookie de Supabase Auth) o si la URL es `/merch/[slug]` (storefront de partner) y completar `tenant_id`. Si es checkout B2C puro → `tenant_id = NULL`.

**Pros**: una sola tabla, simple de consultar.
**Contras**: requiere cambios en el checkout + migración + backfill.

### Opción C — Escribir en `partner_orders` cuando se detecta tenant
Mantener `orders` para B2C puro y `partner_orders` para storefronts de partners. En el endpoint de checkout, ramificar según contexto.

**Pros**: mantiene la separación clean.
**Contras**: duplica lógica (dos tablas con shape similar), el admin necesita query combinado.

---

## 4. Recomendación

**Opción B** parece la más razonable dado que:
- Es la que más se alinea con el carrito unificado que ya existe (no hay que duplicar lógica).
- Permite reportes cross-tenant + globales sin UNIONs.
- El backfill es manejable: por defecto `tenant_id=NULL` en filas existentes (todas asumibles B2C).

**Pero antes de implementar**, hay que confirmar:
1. ¿Qué identifica a un partner en runtime? ¿Sesión Supabase con flag? ¿URL `/merch/[slug]`? ¿Cookie?
2. ¿`whatsapp_orders` realmente existe en producción? ¿Qué la llena?
3. ¿El admin tiene acceso a `fvsjvvyohaarivametxq` o solo a `ywsoqaclylvrbqfvwofr`? (Si están en proyectos distintos, hay un problema de cross-project queries.)

---

## 5. Preguntas para sambu

1. Confirmar: ¿`partner_orders` está en el proyecto `fvsjvvyohaarivametxq` o `ywsoqaclylvrbqfvwofr`?
2. ¿Cómo identificamos a un partner en checkout? (sesión, URL, manual?)
3. ¿Existe `whatsapp_orders` en producción? ¿Qué la llena? Si existe y tiene los 139 pending → audit MP debe rehacerse contra esa tabla.
4. ¿Querés Opción A, B o C? Recomendación: **B**.
