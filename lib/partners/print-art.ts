/**
 * Arte de producción de un producto de partner — lectura/escritura unificada.
 *
 * Había DOS modelos conviviendo en `partner_products.metadata`, escritos por
 * pantallas distintas y leídos por caminos distintos:
 *
 *  - `metadata.print.{front,back}` + `dualSide` — lo escribe el Studio
 *    (`/workspace/design-engine`) y es lo que el checkout web manda a producción
 *    (`app/p/[slug]/[product]/AddToCartButtons.tsx` → frontDesign/backDesign).
 *  - `metadata.print_ready_url` + `print_side` — lo escribía el form de
 *    `/workspace/catalog`: UN solo archivo con un desplegable de lado. Lo lee el
 *    modal de "Cargar pedido" (`/workspace/orders`).
 *
 * Al ser un solo archivo, un partner que quería agregar arte de dorso terminaba
 * PISANDO el arte del frente, y el `print_side: 'dorso'` no poblaba `print.back`,
 * así que el dorso nunca llegaba a producción por el checkout. Caso real: tienda
 * `sponsors`, 18/09/2026.
 *
 * Desde acá, `metadata.print.{front,back}` es la fuente de verdad. Los campos
 * viejos se siguen ESCRIBIENDO derivados (hay productos y código que los leen) y
 * se siguen LEYENDO como fallback para los productos que solo tienen esos.
 */

export type PrintStampMode = 'large' | 'medium' | 'chest-logo'
export type PrintSideLegacy = 'frente' | 'dorso' | 'ambos'

export interface PrintSpec {
  designUrl?: string | null
  stampMode?: PrintStampMode | null
  placement?: string | null
  widthCm?: number | null
}

export interface PrintArt {
  front: string
  back: string
}

type Meta = Record<string, unknown> | null | undefined

function specUrl(v: unknown): string {
  if (!v || typeof v !== 'object') return ''
  const url = (v as PrintSpec).designUrl
  return typeof url === 'string' ? url.trim() : ''
}

/**
 * Devuelve la URL del arte de cada lado. Prioriza `metadata.print`; si un lado no
 * tiene arte ahí, cae al modelo viejo ubicando `print_ready_url` según `print_side`
 * ('ambos' se trata como frente: el campo guardaba un solo archivo).
 */
export function readPrintArt(metadata: Meta): PrintArt {
  const m = (metadata || {}) as Record<string, unknown>
  const print = (m.print || {}) as Record<string, unknown>

  let front = specUrl(print.front)
  let back = specUrl(print.back)

  const legacyUrl = typeof m.print_ready_url === 'string' ? m.print_ready_url.trim() : ''
  if (legacyUrl) {
    const side = m.print_side as PrintSideLegacy | undefined
    if (side === 'dorso') {
      if (!back) back = legacyUrl
    } else if (!front) {
      front = legacyUrl
    }
  }

  return { front, back }
}

/**
 * Aplica el arte de frente/dorso sobre la metadata del producto.
 *
 * Preserva `stampMode`/`placement`/`widthCm` que ya hubiera escrito el Studio para
 * ese lado — el form de catálogo solo sabe de la URL y no debe borrar la medida
 * real con la que se produce. Vaciar un lado lo elimina.
 */
export function writePrintArt(metadata: Meta, art: Partial<PrintArt>): Record<string, unknown> {
  const out = { ...((metadata || {}) as Record<string, unknown>) }
  const prevPrint = (out.print || {}) as Record<string, unknown>
  const front = (art.front || '').trim()
  const back = (art.back || '').trim()

  const sideSpec = (prev: unknown, url: string): PrintSpec | null => {
    if (!url) return null
    const base = (prev && typeof prev === 'object' ? prev : {}) as PrintSpec
    return { ...base, designUrl: url }
  }

  const nextPrint: Record<string, unknown> = {
    ...prevPrint,
    front: sideSpec(prevPrint.front, front),
    back: sideSpec(prevPrint.back, back),
  }

  if (front || back) {
    out.print = nextPrint
    out.dualSide = !!front && !!back
    // Derivados para lo que todavía lee el modelo viejo (un solo archivo).
    out.print_ready_url = front || back
    out.print_side = front && back ? 'ambos' : front ? 'frente' : 'dorso'
  } else {
    // Sin arte: se limpian los lados, pero NO se borra `print` entero si trae
    // otras claves que escribió el Studio y este form no conoce.
    if (Object.keys(prevPrint).some((k) => k !== 'front' && k !== 'back')) {
      out.print = nextPrint
    } else {
      delete out.print
    }
    delete out.dualSide
    delete out.print_ready_url
    delete out.print_side
  }

  return out
}
