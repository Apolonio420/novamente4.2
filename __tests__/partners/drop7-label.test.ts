/**
 * DROP7 (piloto "lanzamiento de 7 días", 30/09/2026): tenants.metadata.drop7 =
 * { starts_at, ends_at } marca la semana de lanzamiento de una tienda partner.
 * lib/partners/drop7.ts::drop7Label() decide si un pedido nace dentro de esa
 * ventana usando su fecha de CREACIÓN (no "ahora" — una transferencia de un
 * pedido del domingo se confirma el lunes y tiene que salir etiquetada igual).
 */
import { describe, it, expect } from 'vitest'
import { drop7Label, drop7LabelForTenants } from '@/lib/partners/drop7'

const tenant = (name: string, starts_at: unknown, ends_at: unknown) => ({
  name,
  metadata: { drop7: { starts_at, ends_at } },
})

describe('drop7Label — dentro/fuera de rango', () => {
  it('pedido creado DENTRO de la ventana → etiqueta con la marca', () => {
    const t = tenant('Aldea', '2026-10-01T00:00:00.000Z', '2026-10-08T00:00:00.000Z')
    expect(drop7Label(t, '2026-10-03T12:00:00.000Z')).toBe('🚀 DROP7 · Aldea')
  })

  it('pedido creado ANTES de starts_at → null', () => {
    const t = tenant('Aldea', '2026-10-01T00:00:00.000Z', '2026-10-08T00:00:00.000Z')
    expect(drop7Label(t, '2026-09-30T23:59:59.999Z')).toBeNull()
  })

  it('pedido creado DESPUÉS de ends_at → null', () => {
    const t = tenant('Aldea', '2026-10-01T00:00:00.000Z', '2026-10-08T00:00:00.000Z')
    expect(drop7Label(t, '2026-10-08T00:00:00.001Z')).toBeNull()
  })
})

describe('drop7Label — bordes (rango inclusive)', () => {
  it('created_at === starts_at exacto → etiqueta (el primer pedido de la campaña no se pierde)', () => {
    const t = tenant('Berlin', '2026-10-01T00:00:00.000Z', '2026-10-08T00:00:00.000Z')
    expect(drop7Label(t, '2026-10-01T00:00:00.000Z')).toBe('🚀 DROP7 · Berlin')
  })

  it('created_at === ends_at exacto → etiqueta (transferencia del último día, confirmada al toque)', () => {
    const t = tenant('Berlin', '2026-10-01T00:00:00.000Z', '2026-10-08T00:00:00.000Z')
    expect(drop7Label(t, '2026-10-08T00:00:00.000Z')).toBe('🚀 DROP7 · Berlin')
  })

  it('el caso que motiva la regla: pedido del domingo confirmado el lunes sigue etiquetado', () => {
    // Ventana termina el lunes 00:00. El pedido nació el domingo a la noche
    // (dentro de la ventana) pero la transferencia se confirma horas después,
    // ya "el lunes" — drop7Label usa SIEMPRE la fecha de creación del pedido.
    const t = tenant('Boston', '2026-09-28T00:00:00.000Z', '2026-10-05T00:00:00.000Z')
    const creadoDomingoNoche = '2026-10-04T23:30:00.000Z'
    expect(drop7Label(t, creadoDomingoNoche)).toBe('🚀 DROP7 · Boston')
  })
})

describe('drop7Label — tolerancia a metadata ausente o rota', () => {
  it('tenant null/undefined → null', () => {
    expect(drop7Label(null, '2026-10-03T00:00:00.000Z')).toBeNull()
    expect(drop7Label(undefined, '2026-10-03T00:00:00.000Z')).toBeNull()
  })

  it('sin metadata → null', () => {
    expect(drop7Label({ name: 'Aldea' }, '2026-10-03T00:00:00.000Z')).toBeNull()
  })

  it('metadata sin drop7 → null', () => {
    expect(drop7Label({ name: 'Aldea', metadata: { otraCosa: 1 } }, '2026-10-03T00:00:00.000Z')).toBeNull()
  })

  it('drop7 no es un objeto (config cargada mal a mano) → null', () => {
    expect(drop7Label({ name: 'Aldea', metadata: { drop7: 'no-deberia-ser-string' } }, '2026-10-03T00:00:00.000Z')).toBeNull()
  })

  it('starts_at/ends_at con fechas inválidas → null', () => {
    const t = tenant('Aldea', 'no-es-fecha', '2026-10-08T00:00:00.000Z')
    expect(drop7Label(t, '2026-10-03T00:00:00.000Z')).toBeNull()
  })

  it('starts_at/ends_at invertidos (cargados al revés a mano) → null, nunca etiqueta siempre', () => {
    const t = tenant('Aldea', '2026-10-08T00:00:00.000Z', '2026-10-01T00:00:00.000Z')
    expect(drop7Label(t, '2026-10-03T00:00:00.000Z')).toBeNull()
  })

  it('orderCreatedAt ausente o inválido → null', () => {
    const t = tenant('Aldea', '2026-10-01T00:00:00.000Z', '2026-10-08T00:00:00.000Z')
    expect(drop7Label(t, null)).toBeNull()
    expect(drop7Label(t, undefined)).toBeNull()
    expect(drop7Label(t, 'no-es-fecha')).toBeNull()
  })

  it('tenant sin nombre (o vacío) → null, no manda "DROP7 · " pelado', () => {
    const t = { name: '', metadata: { drop7: { starts_at: '2026-10-01T00:00:00.000Z', ends_at: '2026-10-08T00:00:00.000Z' } } }
    expect(drop7Label(t, '2026-10-03T00:00:00.000Z')).toBeNull()
  })

  it('nunca tira, aunque metadata venga con formas totalmente inesperadas', () => {
    expect(() => drop7Label({ name: 'X', metadata: { drop7: { starts_at: {}, ends_at: [] } } } as any, '2026-10-03T00:00:00.000Z')).not.toThrow()
  })
})

describe('drop7LabelForTenants — pedido con ítems de más de un tenant', () => {
  it('etiqueta si CUALQUIERA de los tenants está en lanzamiento', () => {
    const fuera = tenant('Fuera', '2026-01-01T00:00:00.000Z', '2026-01-08T00:00:00.000Z')
    const enLanzamiento = tenant('Aldea', '2026-10-01T00:00:00.000Z', '2026-10-08T00:00:00.000Z')
    expect(drop7LabelForTenants([fuera, enLanzamiento], '2026-10-03T00:00:00.000Z')).toBe('🚀 DROP7 · Aldea')
  })

  it('ninguno en lanzamiento → null', () => {
    const a = tenant('A', '2026-01-01T00:00:00.000Z', '2026-01-08T00:00:00.000Z')
    const b = tenant('B', '2026-02-01T00:00:00.000Z', '2026-02-08T00:00:00.000Z')
    expect(drop7LabelForTenants([a, b], '2026-10-03T00:00:00.000Z')).toBeNull()
  })

  it('lista vacía o con nulls → null, no rompe', () => {
    expect(drop7LabelForTenants([], '2026-10-03T00:00:00.000Z')).toBeNull()
    expect(drop7LabelForTenants([null, undefined], '2026-10-03T00:00:00.000Z')).toBeNull()
  })
})
