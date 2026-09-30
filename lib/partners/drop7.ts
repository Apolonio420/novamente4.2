/**
 * Etiqueta "🚀 DROP7 · <Marca>" para los avisos de venta de una tienda partner
 * que está en su semana de lanzamiento (piloto DROP7, 30/09/2026).
 *
 * Config SIN migración: se carga a mano en `tenants.metadata.drop7`:
 *   { starts_at: "2026-10-01T00:00:00.000Z", ends_at: "2026-10-08T00:00:00.000Z" }
 *
 * Usa la fecha de CREACIÓN del pedido, no "ahora": una transferencia de un
 * pedido del domingo se confirma el lunes y tiene que salir etiquetada igual
 * (si no, la venta más importante del lanzamiento — la primera — se pierde).
 *
 * Tolerante a todo: metadata ausente, drop7 ausente, fechas rotas/invertidas,
 * tenant sin nombre → siempre null, nunca tira.
 */

export interface Drop7TenantLike {
  name?: string | null
  metadata?: Record<string, unknown> | null | undefined
}

/**
 * `null`/`undefined` si el tenant no está en su semana DROP7 (o falta algo
 * para decidirlo); si no, la etiqueta lista para anteponer al aviso.
 */
export function drop7Label(
  tenant: Drop7TenantLike | null | undefined,
  orderCreatedAt: string | number | Date | null | undefined,
): string | null {
  try {
    if (!tenant || !orderCreatedAt) return null

    const drop7 = (tenant.metadata as any)?.drop7
    if (!drop7 || typeof drop7 !== 'object') return null

    const starts = new Date(drop7.starts_at)
    const ends = new Date(drop7.ends_at)
    if (Number.isNaN(starts.getTime()) || Number.isNaN(ends.getTime())) return null

    const created = new Date(orderCreatedAt)
    if (Number.isNaN(created.getTime())) return null

    // Rango inclusive en ambos bordes. Tolerante a starts/ends invertidos: si
    // alguien los carga al revés, no hay ventana válida → no etiqueta (mejor
    // "no avisar" que avisar siempre).
    if (starts.getTime() > ends.getTime()) return null
    if (created.getTime() < starts.getTime() || created.getTime() > ends.getTime()) return null

    const marca = tenant.name?.trim()
    if (!marca) return null

    return `🚀 DROP7 · ${marca}`
  } catch {
    return null
  }
}

/**
 * Un pedido puede tener ítems de más de un tenant (carrito mixto). Etiqueta
 * si CUALQUIERA de los tenants involucrados está en su semana de lanzamiento
 * — la fecha de creación es la misma para todo el pedido. Devuelve la
 * primera etiqueta que matchea.
 */
export function drop7LabelForTenants(
  tenants: Array<Drop7TenantLike | null | undefined>,
  orderCreatedAt: string | number | Date | null | undefined,
): string | null {
  for (const tenant of tenants || []) {
    const label = drop7Label(tenant, orderCreatedAt)
    if (label) return label
  }
  return null
}
