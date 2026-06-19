/**
 * Puente de producción (server-side) entre el workspace del partner y el
 * sistema interno de Novamente (repo platform-master / admin.novamente.ar).
 *
 * Cuando un partner carga un pedido marcado para PRODUCIR, llamamos al endpoint
 * interno `/api/partners/orders/submit` con BOT_API_SECRET. Le mandamos SOLO
 * datos partner-safe (producto, color, talle, cantidad, estampa, PVP y precio
 * partner). El costo del proveedor y el margen los calcula y guarda platform-
 * master — este repo nunca los toca. La respuesta es solo { ok, pedido_numero }.
 *
 * Env:
 *   PLATFORM_API_BASE_URL — base del admin (ej. https://admin.novamente.ar)
 *   BOT_API_SECRET        — secreto compartido con platform-master
 */

export interface ProductionItem {
  producto: string                 // nombre canónico (para matchear costo + producción)
  color: string
  talle: string
  cantidad: number
  doble_estampa: 'Si' | 'No' | 'Chica'
  comments?: string
  mockup_url?: string              // imagen del producto elegido (para que el equipo vea el diseño)
  print_url?: string               // arte print-ready (best-effort)
  pvp: number                      // partner-safe: lo que el partner le cobra al cliente (unitario)
  precio_partner: number           // partner-safe: lo que el partner nos transfiere (unitario)
}

export interface ProductionRequest {
  tenant: { id: string; name: string; slug: string }
  cliente?: string
  telefono?: string
  direccion?: string
  notas?: string
  items: ProductionItem[]
}

export interface ProductionResult {
  ok: boolean
  pedido_numero?: string
  error?: string
}

export async function sendToProduction(req: ProductionRequest): Promise<ProductionResult> {
  const base = process.env.PLATFORM_API_BASE_URL
  const secret = process.env.BOT_API_SECRET
  if (!base || !secret) {
    return { ok: false, error: 'Producción no configurada (PLATFORM_API_BASE_URL / BOT_API_SECRET)' }
  }

  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/api/partners/orders/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({
        tenant_id: req.tenant.id,
        tenant_name: req.tenant.name,
        tenant_slug: req.tenant.slug,
        cliente: req.cliente,
        telefono: req.telefono,
        direccion: req.direccion,
        notas: req.notas,
        items: req.items,
      }),
      signal: AbortSignal.timeout(25_000),
    })

    // platform-master responde SOLO { ok, pedido_numero } — nunca costo/margen.
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; pedido_numero?: string; error?: string }
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || `HTTP ${res.status}` }
    }
    return { ok: true, pedido_numero: data.pedido_numero }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
