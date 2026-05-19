# Decisions Log — Autopilot v4.2

Solo decisiones técnicas no obvias. Formato:

```
#### [YYYY-MM-DD] Título
**Contexto:** por qué surgió
**Decisión:** qué se eligió
**Alternativas rechazadas:** qué se descartó y por qué
**Impacto:** archivos/sistemas afectados
```

---

## Auditoría tracking de ventas 2026-05-18

### Tablas DB involucradas

| Tabla | Uso | Tiene tenant_id |
|-------|-----|----------------|
| `orders` | Órdenes B2C globales (checkout storefront público) | ❌ NO |
| `partner_orders` | Órdenes del workspace del partner | ✅ SÍ |
| `partner_leads` | Leads capturados en storefronts | ✅ SÍ |
| `partner_analytics_events` | Eventos de visitas y conversiones | ✅ SÍ |

### Archivos clave

- **Checkout B2C:** `app/api/checkout/route.ts` + `app/api/checkout/transfer/route.ts` → escriben en `orders` vía `lib/db.ts:createOrder`
- **Webhook MP (B2C):** `app/api/webhooks/mercadopago/route.ts` → actualiza `orders.payment_status` y `orders.status`
- **Webhook MP (partners/subs):** `app/api/partners/webhook/mercadopago/route.ts` → solo maneja suscripciones de plan, NO órdenes de storefront
- **KPIs dashboard partner:** `lib/partners/dashboard-kpis.ts` → lee de `partner_orders`
- **Analytics:** `lib/partners/analytics-queries.ts` → lee de `partner_analytics_events`

### Métricas calculadas en el dashboard

`lib/partners/dashboard-kpis.ts` computa:
- `revenue30d`, `revenuePrev30d`, `revenueChangePct`
- `orders30d`, `ordersPrev30d`, `avgOrderValue`
- `topProduct` (por revenue, de items de ordenes)
- `conversionRate` = orders30d / leadsThisMonth %
- `pendingOrders`, `approvedOrders`, `fulfilledOrders`
- `ordersByDay` (últimos 30 días)

### Agujeros detectados (BUGS)

**BUG-1 (CRÍTICO): Las ventas B2C del storefront NO llegan al dashboard del partner.**

- El checkout público escribe en la tabla `orders` (sin `tenant_id`).
- El dashboard del partner lee de `partner_orders` (con `tenant_id`).
- No existe ningún código que, al confirmar un pago en el webhook principal, también escriba en `partner_orders` para el tenant correspondiente.
- **Resultado:** El partner ve `revenue30d = 0` y `orders30d = 0` aunque haya ventas reales en su storefront.

**BUG-2 (MENOR): `conversionRate` usa `orders30d` (último mes) vs `leadsThisMonth` (mes calendario actual).** Las ventanas temporales no son consistentes — si el mes empieza el 1, en los primeros días el rate puede ser 0 aunque hay órdenes del mes pasado aún activos.

**BUG-3 (MENOR): La tabla `orders` no tiene `tenant_id`.** Imposible asociar una venta a un partner sin un campo de referencia. El checkout tampoco recibe ni almacena el slug del storefront desde donde vino la orden, por lo que hay pérdida de atribución.

### Tareas sugeridas (para que el humano decida prioridad)

Ver sección BACKLOG FUTURO — se agregan como TASK-005 y TASK-006.

---

## Auditoria imagenes hero lifestyle — 2026-05-18

### Candidatos identificados (todos < 100 KB, nombre hero/carousel/blog, usados en TSX)

| archivo | KB | paginas que lo usan |
|---------|----|---------------------|
| home-carousel-2.webp | 38 KB | app/page.tsx |
| hero-otono-streetwear.webp | 47 KB | app/page.tsx, app/merchs, app/estampar-remeras, app/merch-para-bandas, app/merch-para-creadores, app/blog |
| hero-azotea-blue-hour.webp | 48 KB | app/page.tsx, app/remeras-cumpleanos |
| hero-regalo-pareja.webp | 48 KB | app/regalos-personalizados |
| hero-lanza-tu-marca.webp | 49 KB | app/lanza-tu-marca |
| hero-buzos-egresados.webp | 52 KB | app/buzos-egresados |
| hero-merch-para-bandas-v2.webp | 52 KB | (pendiente verificar) |
| hero-buzos-personalizados.webp | 57 KB | (pendiente verificar) |
| blog-cover-dtg.webp | 56 KB | (pendiente verificar) |
| blog-cover-merch-sin-inversion.webp | 58 KB | (pendiente verificar) |

**Cap sprint actual:** 5 imagenes (las 5 mas pequeñas).
**Sprint siguiente:** hero-buzos-egresados, hero-merch-para-bandas-v2, hero-buzos-personalizados, blog-cover-dtg, blog-cover-merch-sin-inversion.

### Script generado

`scripts/regen-heroes.js` — listo para ejecutar. Requiere aprobacion de usuario para correr `node`.

**Ejecucion:**
```bash
node --env-file .env.local scripts/regen-heroes.js
```

**Logica:** analiza cada imagen con Gemini vision → extrae prompt mejorado → genera nueva imagen con gemini-3-pro-image-preview → convierte a WebP 1920x1080 quality 85 con sharp → verifica ≥150 KB y ≥1600px → backup en _originals/ → sobreescribe original.

**STATUS: SCRIPT_READY — ejecucion pendiente aprobacion manual.**

---

#### [2026-05-18] Setup inicial autopilot v4.2
**Contexto:** Repo no tenía backlog ni autopilot. Existían `.planning/` (GSD histórico, todas fases DONE) y `scripts/watchdog.ps1` (Windows-only, event-driven).
**Decisión:** Crear sistema nuevo bajo `backlog/` + `scripts/autopilot-v2.sh` sin tocar lo existente (opción COEXISTIR).
**Alternativas rechazadas:** (b) extender `.planning/` con Phase 9 — invasivo, rompe convención GSD. (c) híbrido — complejidad innecesaria.
**Impacto:** `backlog/`, `scripts/autopilot-v2.sh`, `scripts/autopilot-loop.sh`, `scripts/backlog-auto-feeder.sh`, `.gitignore` (append).

## Regeneracion imagenes hero Gemini — 2026-05-19

| archivo | KB antes | KB despues | dimensiones | prompt usado | resultado |
|---------|----------|------------|-------------|--------------|----------|
| home-carousel-2.webp | 38 KB | 113 KB | 1920x1080 | Asian woman in black hoodie with graphic mask, rooftop, city... | FAIL — Too small: 113KB / 1920px |
| hero-otono-streetwear.webp | 46 KB | 114 KB | 1920x1080 | Young man on rooftop at dusk, hoodie, phone, city lights ref... | FAIL — Too small: 114KB / 1920px |
| hero-azotea-blue-hour.webp | 47 KB | 166 KB | 1920x1080 | Young man in beige graphic hoodie on rooftop at dusk, lookin... | OK |
| hero-regalo-pareja.webp | 47 KB | 183 KB | 1920x1080 | A couple hugging, woman wearing a t-shirt with a heart desig... | OK |
| hero-lanza-tu-marca.webp | 48 KB | 206 KB | 1920x1080 | woman in graphic tee, black cargo pants, rooftop at dusk, ci... | OK |

## Regeneracion imagenes hero Gemini — 2026-05-19

| archivo | KB antes | KB despues | dimensiones | prompt usado | resultado |
|---------|----------|------------|-------------|--------------|----------|
| home-carousel-2.webp | 38 KB | 323 KB | 1920x1080 | Woman in graphic black hoodie on rooftop at sunset. City sky... | OK |
| hero-otono-streetwear.webp | 46 KB | 356 KB | 1920x1080 | A young man on a rooftop at night, wearing a hoodie, looking... | OK |
| hero-azotea-blue-hour.webp | 166 KB | 166 KB | 1920x1080 | ... | SKIP — Already regenerated |
| hero-regalo-pareja.webp | 183 KB | 183 KB | 1920x1080 | ... | SKIP — Already regenerated |
| hero-lanza-tu-marca.webp | 206 KB | 206 KB | 1920x1080 | ... | SKIP — Already regenerated |
