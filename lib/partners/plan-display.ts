import { ANNUAL_DISCOUNT } from "./plans"

export type PriceView = {
  /** Precio principal a mostrar grande (ej. "USD$25"). */
  main: string
  /** Línea secundaria explicativa (facturación / ahorro / "después $X"). */
  sub: string
  /** Precio tachado (ej. "USD$50") o null si no hay tachado. */
  strike: string | null
}

/**
 * Calcula los textos de precio para una card de plan.
 * `promoPct` (ej. 0.5) aplica un descuento de primer año SOLO sobre el display.
 * El tachado siempre referencia el precio mensual de lista, para que la
 * comparación sea clara tanto en mensual como en anual.
 */
export function formatUsdPrice(
  monthlyUsd: number,
  annual: boolean,
  promoPct = 0,
): PriceView {
  if (!annual) {
    if (promoPct > 0) {
      const promoMonthly = Math.round(monthlyUsd * (1 - promoPct) * 100) / 100
      return {
        main: `USD$${promoMonthly}`,
        strike: `USD$${monthlyUsd}`,
        sub: `Primer año · después USD$${monthlyUsd}/mes · facturado en ARS al cambio del día`,
      }
    }
    return {
      main: `USD$${monthlyUsd}`,
      strike: null,
      sub: "Facturado en ARS al tipo de cambio del día",
    }
  }

  const annualMonthly = Math.round(monthlyUsd * (1 - ANNUAL_DISCOUNT) * 10) / 10
  const annualTotal = Math.round(monthlyUsd * 12 * (1 - ANNUAL_DISCOUNT))

  if (promoPct > 0) {
    const firstYearTotal = Math.round(annualTotal * (1 - promoPct))
    const firstYearMonthly = Math.round((firstYearTotal / 12) * 100) / 100
    const savings = monthlyUsd * 12 - firstYearTotal
    return {
      main: `USD$${firstYearMonthly}`,
      strike: `USD$${monthlyUsd}`,
      sub: `Primer año · US$${firstYearTotal}/año (ahorrás US$${savings}) · después US$${annualTotal}/año`,
    }
  }

  const savings = Math.round(monthlyUsd * 12 * ANNUAL_DISCOUNT)
  return {
    main: `USD$${annualMonthly}`,
    strike: `USD$${monthlyUsd}`,
    sub: `Facturado anualmente · US$${annualTotal}/año · ahorrás US$${savings}`,
  }
}
