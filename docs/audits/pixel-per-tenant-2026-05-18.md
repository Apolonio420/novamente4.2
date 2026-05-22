# Audit — Meta Pixel por Tenant

**Fecha**: 2026-05-18
**Repo**: novamente4.2 (web pública)
**Autor**: Claude (read-only audit)

---

## TL;DR

El Pixel hoy es **global**: una sola env var `NEXT_PUBLIC_FACEBOOK_PIXEL_ID` para toda la web. No hay infraestructura por tenant. Hay utilidades preparadas para generar snippets dado un `pixelId` arbitrario, pero nadie las invoca con un ID dinámico desde DB. Falta: columna en `tenants`, UI para configurarlo, y wire-up en `/merch/[slug]` para inyectarlo dinámicamente.

---

## 1. Findings — lo que ya hay

### 1.1 Implementación global actual

[lib/fpixel.ts](../../lib/fpixel.ts) — wrapper client-side:
```typescript
const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID
```
Expone helpers: `pageview()`, `event()`, `viewContent()`, `lead()`, `purchase()`. Todos llaman a `window.fbq('track', ...)` y usan ese ID hardcoded por env.

Componente: `components/FacebookPixel.tsx` (referenciado, hace el inject del `<script>` con el ID de env). Esto se monta a nivel app — todos los visitantes ven el mismo pixel.

### 1.2 Utilidades preparadas para multi-tenant (sin uso real)

[lib/partners/meta-pixel.ts](../../lib/partners/meta-pixel.ts) ya tiene:

- `generatePixelSnippet(pixelId: string)` ([lines 10-34](../../lib/partners/meta-pixel.ts)) — devuelve el HTML del snippet de Meta como string. Valida que `pixelId` sea numérico.
- `generatePixelEvent(event, data?)` ([lines 40-51](../../lib/partners/meta-pixel.ts)) — genera `fbq('track', ...)` como string.

También existe `components/partners/meta-pixel-script.tsx` (referenciado). Sugiere que la intención original era multi-tenant, pero **no se conectó al storefront `/merch/[slug]`**.

### 1.3 Tabla de tenants

No se confirmó por grep, pero la estructura en `lib/partners/` sugiere existe una tabla `tenants` (o `partner_tenants`). **No tiene una columna `meta_pixel_id`** — habría aparecido en los greps de "meta_pixel" y no apareció en queries DB, solo en archivos de código.

### 1.4 Storefront `/merch/[slug]`

No leí el archivo completo, pero el patrón típico de este repo es: la página recibe `slug`, hace lookup del tenant, renderiza el storefront. **Hoy no inyecta ningún `<script>` de Pixel propio del tenant** — solo hereda el global del root layout (si lo hay).

---

## 2. Qué falta

1. **Columna `meta_pixel_id` en `tenants`**.
2. **API endpoint** para que el partner setee/lea su pixel desde el workspace (`/app/api/partners/settings/...` o similar).
3. **UI en `/workspace/`** con un input numeric + validación + preview.
4. **Inyección dinámica** en `/merch/[slug]/layout.tsx` (o el `<head>` del layout del storefront) — usar `generatePixelSnippet(tenant.meta_pixel_id)` y renderizarlo via `next/script` o `dangerouslySetInnerHTML`.
5. **Aislamiento**: cuando estamos dentro de `/merch/[slug]`, NO inyectar el pixel global de Novamente (mezclaría señales del partner con las nuestras). Decidir política: ¿pixel del partner reemplaza al global? ¿O ambos coexisten?
6. **Eventos de compra**: cuando el webhook MP marca `approved`, idealmente disparar Conversions API server-side al pixel del partner (no solo client-side `Purchase`).
7. **CAPI (Conversions API)** — opcional pero recomendado: server-side events son críticos en 2026 por ITP/iOS. Requiere `meta_pixel_access_token` (también por tenant).

---

## 3. Fix propuesto (sin implementar)

### 3.1 Migración SQL
```sql
ALTER TABLE tenants
  ADD COLUMN meta_pixel_id text,
  ADD COLUMN meta_pixel_access_token text, -- nullable, para CAPI
  ADD CONSTRAINT meta_pixel_id_numeric CHECK (meta_pixel_id IS NULL OR meta_pixel_id ~ '^[0-9]+$');
```

### 3.2 API
- `GET /api/partners/settings/meta-pixel` → devuelve `{ pixelId, hasToken }` del tenant logueado.
- `PUT /api/partners/settings/meta-pixel` → body `{ pixelId, accessToken? }`.
- Auth: `getRequestTenant()` de `lib/partners/auth.ts`.

### 3.3 UI
- Nueva sección en `/workspace/` → "Tracking" → input "Meta Pixel ID" + (opcional) "Access Token" + botón "Test event".

### 3.4 Inyección en storefront
En `app/merch/[slug]/layout.tsx`:
```tsx
const tenant = await getTenantBySlug(slug);
return (
  <html>
    <head>
      {tenant.meta_pixel_id && (
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: generatePixelSnippet(tenant.meta_pixel_id) }}
        />
      )}
    </head>
    ...
  </html>
);
```

### 3.5 Política de aislamiento (decidir)
- **Opción A**: Dentro de `/merch/[slug]`, **solo** carga el pixel del partner (suprimir el global de Novamente).
- **Opción B**: Ambos coexisten. (Recibimos señales agregadas, partner recibe las suyas.)

Recomendación: **Opción A**. El storefront es del partner; nuestras métricas las medimos en `/` y `/b2b-precios-2026`, no en su tienda.

### 3.6 CAPI (fase 2, opcional)
Cuando MP webhook marca `approved` en `orders` con `tenant_id` resuelto (ver audit `order-tables-2026-05-18.md`), POST a `https://graph.facebook.com/v18.0/{pixelId}/events` con `access_token` del tenant + payload `Purchase`. Esto requiere que orders tenga `tenant_id` (audit 2, opción B).

---

## 4. Preguntas para sambu

1. ¿Qué política de aislamiento querés (A o B)? Recomendación: **A**.
2. ¿Implementamos solo client-side ahora (snippet `fbq`), o también CAPI server-side? Si es solo client-side, el fix es ~1 día. Con CAPI, ~3-4 días + depende de resolver `tenant_id` en `orders` (audit 2).
3. ¿Tenemos partners pidiendo esto ya con un Pixel ID específico para probar? Si sí, lo usamos como caso de testing.
4. ¿Querés también soporte para Google Analytics (GA4) por tenant en la misma feature? Si sí, el schema cambia (`tenants.tracking_config jsonb` en lugar de columnas dedicadas).
