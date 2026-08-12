/**
 * Puente entre el catálogo propio de Novamente y el sistema de reseñas.
 *
 * Las reseñas viven en `product_reviews`, cuya columna product_id es UUID y
 * tenant_id es FK a tenants. El catálogo propio (lib/products.ts) es un array
 * estático con ids tipo "aura-tshirt-blanco", así que no entra directo.
 *
 * En vez de migrar el catálogo (cambiaría las URLs ya indexadas y a las que
 * apuntan los ads), derivamos un UUID determinístico del id estático: mismo
 * producto ⇒ mismo UUID, siempre, sin tabla de mapeo que mantener.
 *
 * Dueño de esas reseñas: el tenant `novamente-internal`, que es del que ya son
 * miembros sambu@ / moishe@ / izzaga@ / apolonio@ — o sea, se moderan en
 * /workspace/reviews sin dar de alta a nadie. (Los otros dos tenants candidatos,
 * `novamente` y `novamente-originals`, no tienen NINGÚN miembro: las reseñas
 * habrían quedado en pending para siempre.)
 */
import { createHash } from 'crypto'
import { PRODUCTS } from '@/lib/products'

export const OWN_CATALOG_TENANT_SLUG = 'novamente-internal'

/** Namespace fijo. Cambiarlo huerfaniza todas las reseñas del catálogo propio. */
const NAMESPACE = '9c2d4b1e-0f3a-4d6b-8e57-1a2b3c4d5e6f'

/** UUID v5 (RFC 4122, SHA-1). A mano: el paquete `uuid` es ESM-only y rompe tsx/vitest. */
function uuidV5(name: string, namespace: string): string {
  const ns = Buffer.from(namespace.replace(/-/g, ''), 'hex')
  const hash = createHash('sha1').update(Buffer.concat([ns, Buffer.from(name, 'utf8')])).digest()
  const b = Buffer.from(hash.subarray(0, 16))
  b[6] = (b[6] & 0x0f) | 0x50 // versión 5
  b[8] = (b[8] & 0x3f) | 0x80 // variante RFC 4122
  const h = b.toString('hex')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

/** UUID estable para un producto del catálogo propio (ej. "aura-tshirt-blanco"). */
export function staticProductUuid(productId: string): string {
  return uuidV5(productId, NAMESPACE)
}

/**
 * UUID → nombre, para que la pantalla de moderación pueda mostrar de qué
 * producto es la reseña (esos UUID no existen en partner_products).
 */
export function staticProductNamesByUuid(): Record<string, string> {
  const out: Record<string, string> = {}
  for (const p of PRODUCTS) out[staticProductUuid(p.id)] = p.name
  return out
}
