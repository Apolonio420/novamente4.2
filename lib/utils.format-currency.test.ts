import { describe, it, expect } from "vitest"
import { formatCurrency } from "@/lib/utils"

// Checkout y transferencia muestran pesos en es-AR sin decimales, igual que el
// resto del sitio (antes en-US: "$35,750.00" — QA checkout 01/10/2026).
describe("formatCurrency", () => {
  it("usa punto de miles y sin decimales", () => {
    expect(formatCurrency(35750)).toBe("$35.750")
    expect(formatCurrency(8500)).toBe("$8.500")
    expect(formatCurrency(1234567)).toBe("$1.234.567")
  })

  it("redondea centavos", () => {
    expect(formatCurrency(39325.4)).toBe("$39.325")
    expect(formatCurrency(39325.5)).toBe("$39.326")
  })

  it("cero, negativos y valores raros", () => {
    expect(formatCurrency(0)).toBe("$0")
    expect(formatCurrency(-3575)).toBe("-$3.575")
    expect(formatCurrency(NaN)).toBe("$0")
  })
})
