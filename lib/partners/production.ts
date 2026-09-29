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
  comments_back?: string           // notas del dorso (ej. "nuca · 7 cm"), para que producción sepa la medida/lugar
  lugar_estampa?: 'Frente' | 'Dorso' | 'Frente y dorso' // dónde va la estampa, derivado del arte cargado
  mockup_url?: string              // imagen del producto elegido (para que el equipo vea el diseño)
  mockup_url_back?: string         // imagen del DORSO del producto elegido, si existe
  print_url?: string               // arte print-ready del FRENTE (best-effort)
  print_url_back?: string          // arte print-ready del DORSO, si lleva doble estampa
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
  /**
   * partner_orders.id (este repo) — platform-master lo usa como ancla de
   * idempotencia: si este mismo pedido ya se produjo (metadata.partner_order_id
   * ya existe en whatsapp_orders), devuelve el pedido_numero SIN volver a
   * mandarlo al Apps Script, y arma un request_id determinístico
   * (`partner:<partnerOrderId>`) para que un reintento nuestro tras un timeout
   * nunca duplique la fila del Sheet.
   */
  partnerOrderId?: string
}

export interface ProductionResult {
  ok: boolean
  pedido_numero?: string
  error?: string
  /**
   * Review Opus 28/09: SOLO 'rechazado' es definitivo (datos inválidos, o el
   * Apps Script rechazó el pedido sin escribir nada) — ahí sí es seguro
   * decirle al partner que corrija y vuelva a cargar. TODO LO DEMÁS (sin
   * `code`, HTTP no-200, error de red, timeout — de platform-master o de
   * ESTE fetch) es 'incierto': no sabemos si el pedido entró a producción.
   * NUNCA hay que decirle al partner "cargalo a mano" ante un 'incierto' —
   * cargarlo de nuevo puede duplicarlo en el Sheet si en realidad sí había
   * entrado. El caller debe avisar que se está verificando, nada más.
   */
  code?: 'incierto' | 'rechazado'
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
        partner_order_id: req.partnerOrderId,
      }),
      // 55s: corre dentro de `after()` (POST /api/partners/orders ya le
      // respondió al partner) — el partner no está esperando, así que no hay
      // apuro por cortar rápido; platform-master ahora espera hasta 45s al
      // Apps Script v29 (más trabajo: Drive + draft) y necesita margen propio
      // para el resto de su handler (antes 25s cortaba ANTES que
      // platform-master, generando un 'incierto' de acá aunque allá hubiera
      // salido bien — review Opus 28/09).
      signal: AbortSignal.timeout(55_000),
    })

    // platform-master responde SOLO { ok, pedido_numero, code? } — nunca costo/margen.
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; pedido_numero?: string; error?: string; code?: string }
    if (!res.ok || !data.ok) {
      const definitivo = data.code === 'rechazado'
      return { ok: false, error: data.error || `HTTP ${res.status}`, code: definitivo ? 'rechazado' : 'incierto' }
    }
    return { ok: true, pedido_numero: data.pedido_numero }
  } catch (e) {
    // Cualquier fallo de ESTE fetch (timeout u otro error de red): no sabemos
    // si platform-master (y en cascada el Apps Script) llegó a procesar el
    // pedido — SIEMPRE 'incierto', nunca un rechazo definitivo.
    return { ok: false, error: e instanceof Error ? e.message : String(e), code: 'incierto' }
  }
}
