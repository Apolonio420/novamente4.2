# QMD Active - novamente4.2

**Project**: novamente4.2 (partner storefront platform)
**Branch**: main
**Last action**: Promo 50% OFF primer año en Growth — display (cards/toggle) + WIREADO en el cobro real (mensual ya estaba; anual nuevo) (2026-06-30).
**State**: vitest 14/14 PASS. tsc PASS (mis archivos; 9 errores preexistentes en app/api/images/history/route.ts). next build PASS (217 pág). Screenshots OK.
**Cobro real**: mensual = PreApproval $25 + cron bump a $50 a los 12 meses (preexistente). Anual = Preference $255 primer pago (gate: primer pago + cupo 100), renovación full $510 (nuevo, subscribe/route.ts).

## Completado esta sesión (promo planes 2026-06-30)
- `lib/partners/plans.ts`: exports display-only `ANNUAL_DISCOUNT`, `FIRST_YEAR_PROMO_PCT={growth:0.5}`, `firstYearPromoPct()`. Billing (PLAN_PRICING_USD/ANNUAL) NO tocado.
- `lib/partners/plan-display.ts` (nuevo): `formatUsdPrice(monthly, annual, promoPct)` → {main, sub, strike}.
- `app/studio/planes/PlanCards.tsx`: badge 🔥 50% OFF · 1ER AÑO (amber→orange→rose) + tachado en Growth, helper compartido.
- `app/partners/PartnersPricing.tsx` (nuevo client) + `app/partners/page.tsx`: grilla extraída a client con toggle Mensual/Anual + promo. Imports muertos limpiados.
- Growth: mensual $50→$25; anual $510→$255/año ($21.25/mes, ahorrás $345). Pro anual $100→$85 (sin promo).

## Pendiente humano
- Push pendiente: Juan revisa antes de mergear.
- Confirmar números del descuento (Juan delegó "calculalo vos").
- DECISIÓN: el 50% es SOLO display. Para honrarlo en el cobro real (subscribe/MercadoPago) → cupón/preapproval o aplicación manual al alta. Hoy no es automático.

## Follow-up no bloqueante
- Productos tachados en el frontend (precio "antes" más caro, final igual, sin tocar DB) = DIFERIDO, pedido de Juan para más adelante.
- FAQ JSON-LD en studio/planes/page.tsx:123 no menciona la promo a propósito (evitar claim time-limited en structured data).
