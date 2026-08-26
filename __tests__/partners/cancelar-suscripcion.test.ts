/**
 * "Cancelar suscripción" no cancelaba nada en MercadoPago: el handler sólo
 * marcaba el tenant como pausado. El partner leía "Suscripción cancelada" y
 * le seguían debitando la tarjeta todos los meses, y se enteraba por el
 * resumen bancario.
 *
 * Estos tests fijan el contrato del handler: primero MP, y si MP falla NO se
 * cancela nada del lado nuestro.
 */
import { describe, it, expect, vi } from 'vitest'

/** Misma secuencia que app/api/partners/billing/route.ts en action='cancel'. */
async function cancelar(opts: {
  preapprovalId: string | null
  cancelEnMp: () => Promise<{ ok: true } | { ok: false; error: string }>
  pausarTenant: () => Promise<unknown>
}) {
  if (opts.preapprovalId) {
    const r = await opts.cancelEnMp()
    if (!r.ok) return { status: 502, pausado: false }
  }
  await opts.pausarTenant()
  return { status: 200, pausado: true }
}

describe('cancelar la suscripción', () => {
  it('cancela en MercadoPago ANTES de pausar la cuenta', async () => {
    const orden: string[] = []
    await cancelar({
      preapprovalId: 'pre-123',
      cancelEnMp: async () => { orden.push('mp'); return { ok: true } },
      pausarTenant: async () => { orden.push('tenant') },
    })
    expect(orden).toEqual(['mp', 'tenant'])
  })

  it('si MercadoPago falla, NO se marca nada como cancelado', async () => {
    const pausar = vi.fn()
    const r = await cancelar({
      preapprovalId: 'pre-123',
      cancelEnMp: async () => ({ ok: false, error: 'MP caído' }),
      pausarTenant: pausar,
    })
    expect(r.status).toBe(502)
    expect(r.pausado).toBe(false)
    expect(pausar).not.toHaveBeenCalled()   // el bug era pausar igual
  })

  it('sin suscripción en MP (pago único) se pausa igual', async () => {
    const mp = vi.fn()
    const r = await cancelar({
      preapprovalId: null,
      cancelEnMp: mp as any,
      pausarTenant: async () => {},
    })
    expect(mp).not.toHaveBeenCalled()
    expect(r.pausado).toBe(true)
  })
})
