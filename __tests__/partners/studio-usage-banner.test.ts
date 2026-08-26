/**
 * Bug ORIGEN 26/08/2026: partner con plan Growth (ilimitado) veía
 * "Llegaste al límite semanal (1/0 generaciones) — Pasá a Growth".
 *
 * Cadena: checkUsageLimit devuelve {used:0, limit:0, unlimited:true} para
 * planes pagos, pero las APIs de generate/mockup respondían SIN el campo
 * `unlimited` → el cliente veía {used:1, limit:0} → 1 >= 0 → cartel.
 */
import { describe, it, expect } from 'vitest'
import { PLAN_GENERATION_LIMITS } from '@/lib/partners/studio/types'

/** Misma lógica que normalizeUsage() en design-engine/page.tsx. */
function normalizeUsage(u: any) {
  const limit = Number(u?.limit)
  const unlimited = Boolean(u?.unlimited) || !(limit > 0)
  return { ...u, unlimited, percentUsed: unlimited ? 0 : Math.round((Number(u?.used) / limit) * 100) }
}

/** Misma condición que el JSX del cartel. */
const muestraCartel = (u: any) => Boolean(u && !u.unlimited && u.used >= u.limit)

describe('cartel de límite de generaciones', () => {
  it('growth y pro son ilimitados', () => {
    expect(PLAN_GENERATION_LIMITS.growth).toBe(Infinity)
    expect(PLAN_GENERATION_LIMITS.pro).toBe(Infinity)
    expect(Number.isFinite(PLAN_GENERATION_LIMITS.starter)).toBe(true)
  })

  it('el bug exacto de Pablo: {used:1, limit:0} SIN unlimited no puede mostrar el cartel', () => {
    const respuestaVieja = { used: 1, limit: 0, resetLabel: 'sin límite' } // sin `unlimited`
    expect(muestraCartel(respuestaVieja)).toBe(true)            // así estaba: cartel "1/0"
    expect(muestraCartel(normalizeUsage(respuestaVieja))).toBe(false) // normalizado: no
  })

  it('nunca produce percentUsed infinito ni NaN con limit 0', () => {
    const n = normalizeUsage({ used: 7, limit: 0 })
    expect(Number.isFinite(n.percentUsed)).toBe(true)
    expect(n.percentUsed).toBe(0)
    expect(n.unlimited).toBe(true)
  })

  it('un starter que SÍ agotó el cupo sigue viendo el cartel', () => {
    const starter = normalizeUsage({ used: 20, limit: 20, resetLabel: 'esta semana', unlimited: false })
    expect(starter.unlimited).toBe(false)
    expect(muestraCartel(starter)).toBe(true)
    expect(starter.percentUsed).toBe(100)
  })

  it('un starter a mitad de camino no ve el cartel y el porcentaje es real', () => {
    const starter = normalizeUsage({ used: 5, limit: 20, resetLabel: 'esta semana', unlimited: false })
    expect(muestraCartel(starter)).toBe(false)
    expect(starter.percentUsed).toBe(25)
  })
})
