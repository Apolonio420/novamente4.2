# Re-arquitectura novamente.ar — Plan SEO/GEO-safe

**Fecha:** 2026-05-11
**Autor:** Apolonio + Claude
**Branch propuesto:** `feat/home-rearchitecture-seo-safe`

---

## Contexto y diagnóstico

Análisis del live site detectó:

1. **Bug crítico** — `/products` no muestra el grid en el paint inicial (componente client-side hidrata tarde). Imagen above-the-fold rota → bounce alto en intent B2C.
2. **Bug medio** — Hero de la home tiene galería de 4 imágenes que aparecen vacías hasta scroll (CLS alto).
3. **IA confusa** — 3 landings B2B (`/partners`, `/lanza-tu-marca`, `/merchs`) compiten entre sí, con canonicals propios y contenido duplicado.
4. **Promesa rota** — el CTA "Ver directorio de marcas" en `/partners` lleva a `/merchs` que NO es un directorio, es otra landing B2B.
5. **Sin entrada B2C en navbar** — `PRODUCTOS · ESTILOS · FAQ · STUDIO · DISEÑA` mezcla utilities con journeys.

## Decisiones tomadas (validadas por usuario)

### Planes nuevos

| Plan | Precio | Incluye | Diferencia de prendas |
|------|--------|---------|------------------------|
| **Starter** | Gratis | Storefront básico + IA + producción on-demand + 10 productos + 20 leads/mes. Aparece en `/marcas` directorio. | Prendas a **precio retail web** (margen Novamente normal) |
| **Growth** | **US$50/mes** | Todo Starter + branding avanzado + SEO completo + Design Engine + analytics + productos ilimitados + leads ilimitados. Destacado en `/marcas`. | **Costo Novamente + $1.000 ARS** (margen partner mucho mayor) |
| **Pro** | **US$100/mes** | Todo Growth + **chatbot WhatsApp + Instagram DM** + **automatización de contenido IG/FB/X** + setup Meta Ads + onboarding 1:1 + soporte prioritario. Top del directorio. | Mismo costo Novamente + $1.000 ARS |

### Grilla de precios Growth/Pro (costo + $1.000)

Source of truth: `lib/partners/garment-pricing.ts`

| Producto | Costo Novamente | Plan Growth/Pro | Plan Starter (retail) |
|----------|:---:|:---:|:---:|
| Aldea Classic Fit (remera) | $24.696 | **$25.696** | $28.600 |
| Aura Oversize T-Shirt | $25.496 | **$26.496** | $31.000 |
| Buenos Aires (rem. mujer) | $24.696 | **$25.696** | $28.600 |
| Bahamas Crop Mujer | $20.156 | **$21.156** | $23.500 |
| Bali Musculosa | $18.096 | **$19.096** | $21.800 |
| Berlin Buzo Crewneck | $28.088 | **$29.088** | $43.000 |
| Boston Hoodie | $30.120 | **$31.120** | $55.000 |

**TODO técnico:** Hay drift de precios entre `whatsapp-sales-bot/lib/payments/payment-link.ts` y `novamente4.2/lib/partners/garment-pricing.ts`. Unificar en módulo compartido antes del lanzamiento del plan Growth.

### Directorio `/marcas`

- Incluye TODOS los partners publicados (Starter + Growth + Pro)
- Orden: Pro primero (badge "Featured Pro"), luego Growth (badge "Growth"), luego Starter
- Filtros por categoría (música, deporte, arte, comunidad…)
- Schema `CollectionPage` + `ItemList(Organization[])`
- Backend ya existe: `getPublishedTenants()` en `lib/partners/tenant.ts:45-55`

### Ads — sin cambios externos necesarios

- Pixels son globales (PageView en todas las rutas) — `lib/gads.ts` (`AW-18028033546`), `lib/fpixel.ts` (env var)
- Las URLs destino de campañas viven en Google Ads / Meta Ads Manager (externos al repo)
- **301 NO rompe ads** — Google Ads acepta redirects sin penalizar conversiones
- Tracking de conversión global sigue funcionando post-redirect

---

## Arquitectura objetivo

```
novamente.ar/
├── /                       Home — 4 carriles (Comprar / Diseñar / Marcas / Studio)
├── B2C
│   ├── /products           SSR grid + client filters (FIX en PR 1)
│   ├── /products/[id]
│   ├── /design             Generador (intacto)
│   ├── /disena-tu-remera   Landing SEO (intacto)
│   ├── /cart, /checkout    (intacto)
│   └── [long-tails...]     19 landings programáticas (intactas)
├── Marcas
│   ├── /marcas             ★ NUEVO — directorio público
│   └── /p/[slug]           Storefronts (intactos)
└── B2B
    ├── /studio             ★ NUEVO — hub canónico
    ├── /studio/planes      ★ NUEVO — pricing dedicado
    ├── /partners           Aclimatación 14d → 301 a /studio
    ├── /merchs             Aclimatación 14d → 301 a /lanza-tu-marca
    └── /lanza-tu-marca     Mantener (keyword propia)
```

---

## Roadmap por PRs (orden de ejecución)

### PR 1 — Fixes técnicos críticos (0 riesgo SEO)
**Objetivo:** Arreglar bugs visuales que están bajando conversión hoy.

Cambios:
1. Refactor `ProductsFilter.tsx` → separar en `ProductsGrid` (SSR) + `ProductsFilterControls` (client, solo controla visibilidad vía CSS `data-*` attributes, no remonta el grid).
2. Skeleton placeholders en grid mientras se hidrata.
3. Confirmar dimensiones explícitas en hero gallery (componente a identificar en home).

Validación:
- Lighthouse `/products` mobile: LCP < 2.5s, CLS < 0.1
- View source `/products` → ver los `<article>` con productos en el HTML inicial
- JSON-LD `Product` x N sigue en el HTML
- `npm run build` sin errores
- Playwright: cargar `/products` con JS deshabilitado y ver al menos 6 productos

### PR 2 — Header con intent splitter (0 riesgo SEO)
- Reestructurar `Navbar.tsx` con 4 grupos: Comprá, Diseñá, Studio, Marcas + FAQ
- Megamenú con links a long-tails (mejora internal linking)

### PR 3 — Home re-estructurada en 4 carriles (riesgo bajo)
- Preservar todos los H1/H2/H3 actuales con keywords
- Agregar carril "Marcas que producen acá"
- Schema `WebSite` + `Organization` + `Service` actualizado

### PR 4 — Crear `/marcas` (0 riesgo, URL nueva)
- Página SSR con `getPublishedTenants()`
- Filtros por categoría
- Schema `CollectionPage` + `ItemList(Organization[])`
- Agregar a sitemap.ts y llms.txt

### PR 5 — Actualizar planes (Growth $50 / Pro $100)
- Actualizar `lib/partners/garment-pricing.ts` con nuevo tier `partner_growth_pro` (costo + $2.000)
- Actualizar copy de `/partners`, `/lanza-tu-marca`, `/merchs` con los 3 planes nuevos
- Agregar features Pro (chatbot IG/WS + automatización contenido) — flag como "Coming soon" si no está implementado backend aún
- Crear `/studio/planes` con schema `Product` x 3

### PR 6 — `/studio` hub canónico (riesgo bajo)
- Crear `/studio` con contenido de `/partners` mejorado
- En `/partners` → cambiar canonical a `https://www.novamente.ar/studio` (sin redirect aún)
- Período de aclimatación de 14 días con monitoreo GSC

### PR 7 — Schema enrichment + GEO refresh (0 riesgo)
- Actualizar `/llms.txt`, `/llms-full.txt`, `/novamente-entity.json`
- Schemas nuevos en `/marcas`, `/studio`, `/studio/planes`
- Rich Results Test validation

### PR 8 — Redirects definitivos (riesgo medio, reversible)
**Solo después de 14 días de aclimatación y validación GSC.**
- `next.config.mjs`: `/partners` → `/studio`, `/merchs` → `/lanza-tu-marca` (301)
- Remover de sitemap.ts
- Update internal links

---

## Reglas de oro

1. Ninguna URL que rankea pierde su contenido — se redirige o se preserva.
2. Todo 301 documentado en `next.config.mjs` con comentario explicativo.
3. Schemas existentes nunca se eliminan, solo se enriquecen.
4. Long-tails (19 landings programáticas) NO se tocan.
5. Lighthouse antes/después de cada PR; INP/LCP/CLS no pueden empeorar.
6. Internal links rotos se actualizan en el mismo PR que rompe la URL origen.

## Plan de rollback

Cada PR es independiente y se mergea por separado. Si una métrica clave cae:
- PR 1-7: `git revert` del merge commit
- PR 8 (redirects): borrar entries de `next.config.mjs` y redeploy (~10 min)

## Métricas a monitorear (30 días post-deploy)

- GSC: impresiones y clicks de cada URL afectada (semanal)
- Lighthouse CWV (semanal)
- Conversión de signup en Studio (diario)
- Conversión B2C en /products (diario)
- Citas en LLMs (ChatGPT/Perplexity/Gemini/Claude) — test semanal manual

---

## Preguntas resueltas

| # | Pregunta | Respuesta |
|---|----------|-----------|
| 1 | ¿Existe campo de visibilidad pública en `tenants`? | ✅ Sí: `storefront_published`, `status`, `seo_indexable`. Función `getPublishedTenants()` ya está. |
| 2 | ¿Gratuitos en directorio? | Sí, pero después de Pro/Growth (badges destacan los pagos). |
| 3 | ¿Hay analytics de conversión por landing B2B? | TODO — no detectado en repo, vive en GA4/Meta. Pedirle al usuario en sesión siguiente. |
| 4 | ¿Reapuntar ads? | NO necesario. 301 no rompe Google/Meta Ads. URLs destino viven en Ads Manager. |
| 5 | ¿www o sin www? | `www.novamente.ar` (consistente con canonicals actuales). |
