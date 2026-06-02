# QMD Active - novamente4.2

**Project**: novamente4.2 (partner storefront platform)
**Branch**: main
**Last action**: Actualización costos Dreamful + precios partner/B2B + nuevo tier Growth (2026-06-02).
**State**: tsc PASS, next build PASS. Sin commit/push (pendiente revisión humana de Juan).
**Blockers**: ninguno técnico.

## Completado esta sesión (precios Dreamful 2026-06)
- `lib/partners/garment-pricing.ts`: nuevos costos (peor color/familia) + precios partner + campo `b2b_bulk`. Growth = `cost + GROWTH_TIER_DELTA_ARS[tier]` (1000/800/600/400/200). `getGrowthPrice(key,tier)` nuevo; `getPartnerPlanPrice`/`getPlanMargin` con `tier` opcional. Eliminado `PLAN_GROWTH_PRO_MARGIN_ARS`.
- `app/b2b-precios-2026/`: data.ts precios al color caro; page.tsx deriva Growth server-side y lo pasa por prop a B2BCatalog/UnifiedPriceTable (no leak de costo al cliente). Growth "desde 1u".
- `app/studio/planes/page.tsx`: tabla auto-actualiza; FAQ JSON-LD corregido (Aldea 23.670, Hoodie 31.170; margen "hasta ~$7.500").
- `lib/catalog/products.ts`: Musculosa costARS 17400→19500.
- **B2C NO se tocó** (decisión de Juan): retail, b2c_suggested, retailARS, landings, cotizador, DesignCustomizer, PublicAssistant intactos.

## Pendiente humano
- Push pendiente: Juan revisa antes de mergear.
- Copy "hasta ~$7.500 adicionales" en studio/planes HowTo → confirmar con Juan.
- Verificación visual: abrir /b2b-precios-2026 (toggle Growth) y /studio/planes.

## Follow-up no bloqueante
- Superficies autenticadas (workspace/catalog, design-engine, MarginBreakdown, storefront-designer) aún embeben `cost` en bundle cliente (preexistente, auth-gated). A futuro: módulo server-only de costos.
