# QMD Active - novamente4.2

**Project**: novamente4.2 (partner storefront platform)
**Branch**: main
**Last action**: Brief Empresas pulido y nueva landing pública `/empresas` terminados (2026-07-14). Se hicieron dos sincronizaciones seguras (`git fetch --prune` + `git pull --ff-only`), ambas sin cambios remotos.
**State**: Publicado en GitHub: `novamente4.2/main` commit `73030f8` y `chatbot-whastapp/master` commit `007ffb4`. Build Next PASS (225 rutas), `tsc --noEmit` PASS, Playwright Empresas 2/2 PASS y screenshot verificado. Hay WIP previo/no relacionado en `chatbot-whastapp`; no se tocó.
**Cobro real**: mensual = PreApproval $25 + cron bump a $50 a los 12 meses (preexistente). Anual = Preference $255 primer pago (gate: primer pago + cupo 100), renovación full $510 (nuevo, subscribe/route.ts).

## Completado esta sesión (promo planes 2026-06-30)
- `lib/partners/plans.ts`: exports display-only `ANNUAL_DISCOUNT`, `FIRST_YEAR_PROMO_PCT={growth:0.5}`, `firstYearPromoPct()`. Billing (PLAN_PRICING_USD/ANNUAL) NO tocado.
- `lib/partners/plan-display.ts` (nuevo): `formatUsdPrice(monthly, annual, promoPct)` → {main, sub, strike}.
- `app/studio/planes/PlanCards.tsx`: badge 🔥 50% OFF · 1ER AÑO (amber→orange→rose) + tachado en Growth, helper compartido.
- `app/partners/PartnersPricing.tsx` (nuevo client) + `app/partners/page.tsx`: grilla extraída a client con toggle Mensual/Anual + promo. Imports muertos limpiados.
- Growth: mensual $50→$25; anual $510→$255/año ($21.25/mes, ahorrás $345). Pro anual $100→$85 (sin promo).

## Completado esta sesión (Empresas 2026-07-14)
- Nueva landing pública `app/empresas/page.tsx`: propuesta B2B para Compras/RR.HH./Marketing, catálogo visual de las 9 prendas existentes, casos de uso, proceso y CTA de WhatsApp. No expone precios confidenciales B2B/Growth: solicita propuesta por volumen.
- Navegación pública: `EMPRESAS` entre `MARCAS` y `FAQ` en `components/Navbar.tsx`; enlace en footer y sitemap.
- `e2e/empresas-page.spec.ts`: valida hero, CTA, 9 imágenes, navegación y sitemap; screenshot en `test-results/empresas-page.png`. `playwright.config.ts` acepta `PLAYWRIGHT_BASE_URL` para no chocar con otra sesión local.
- Brief regenerado: `chatbot-whastapp/public/brief-empresas/novamente-empresas-2026.pdf` (8 páginas, validación de precios del script). Reemplazó links a la tarifa B2B privada por `novamente.ar/empresas`, donde se muestra el catálogo visual y se cotiza por WhatsApp. El generador local `scripts/generate-brief-empresas-pdf.ts` está ignorado por diseño local de ese repo.

## Pendiente humano
- Push pendiente: Juan revisa antes de mergear.
- Confirmar números del descuento (Juan delegó "calculalo vos").
- DECISIÓN: el 50% es SOLO display. Para honrarlo en el cobro real (subscribe/MercadoPago) → cupón/preapproval o aplicación manual al alta. Hoy no es automático.

## Follow-up no bloqueante
- Productos tachados en el frontend (precio "antes" más caro, final igual, sin tocar DB) = DIFERIDO, pedido de Juan para más adelante.
- FAQ JSON-LD en studio/planes/page.tsx:123 no menciona la promo a propósito (evitar claim time-limited en structured data).
