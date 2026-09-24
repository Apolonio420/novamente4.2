/**
 * Overrides de nombres descriptivos leídos de Supabase `public.product_names`.
 *
 * Ver PLAN-NOMBRES-DESCRIPTIVOS.md — Opción A (aprobada por Juan 24/09/2026):
 * cambiar un nombre = editar una fila en Supabase, se propaga a la tienda sin
 * deploy, en ≤5 min (cache TTL 300s).
 *
 * Esta tabla NO la crea ni la migra este código — otra sesión la crea con
 * key/modelo/descriptivo/genero/plural/aliases/activo/updated_at y RLS de
 * lectura pública. Este loader debe funcionar igual si la tabla todavía no
 * existe: cualquier error (tabla ausente, red caída, fila vacía) cae al
 * fallback hardcodeado de lib/product-names.ts — NUNCA tira.
 */

import { supabaseAdmin } from './supabase-admin'

export interface ProductNameOverrideEntry {
  modelo: string
  descriptivo: string
}

/** Keyed por la key interna del bot (aura_oversize_tshirt, aldea_classic_fit...). */
export type ProductNameOverrides = Record<string, ProductNameOverrideEntry>

const TTL_MS = 300_000 // 5 minutos — ver plan (Opción A)

let cache: { data: ProductNameOverrides; fetchedAt: number } | null = null

/**
 * Hook de test/override manual — NUNCA se escribe en la DB desde acá. Si
 * `PRODUCT_NAMES_TEST_OVERRIDE_JSON` viene seteada (test o debug local),
 * se usa tal cual en lugar de consultar Supabase. Pensado para el criterio
 * de aceptación "cambiar el descriptivo sin escribir en la DB".
 */
function testOverrideFromEnv(): ProductNameOverrides | null {
  const raw = process.env.PRODUCT_NAMES_TEST_OVERRIDE_JSON
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') return parsed as ProductNameOverrides
  } catch {
    // JSON malformado en la env de test — ignorar, seguir con la DB/fallback.
  }
  return null
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

async function fetchFromDb(): Promise<ProductNameOverrides> {
  const { data, error } = await supabaseAdmin
    .from('product_names')
    .select('key, modelo, descriptivo, activo')
    .eq('activo', true)

  if (error) {
    // Tabla todavía no existe (42P01), RLS, red caída, etc. — fallback silencioso.
    console.warn('[product-names-db] no se pudo leer product_names, uso fallback:', error.message)
    return {}
  }

  const overrides: ProductNameOverrides = {}
  for (const row of (data ?? []) as Array<Record<string, unknown>>) {
    const key = row?.key
    const modelo = row?.modelo
    const descriptivo = row?.descriptivo
    if (isNonEmptyString(key) && isNonEmptyString(modelo) && isNonEmptyString(descriptivo)) {
      overrides[key] = { modelo: modelo.trim(), descriptivo: descriptivo.trim() }
    } else {
      console.warn('[product-names-db] fila descartada (campos vacíos):', row?.key)
    }
  }
  return overrides
}

/**
 * Devuelve los overrides vigentes (cache en memoria, TTL 5 min). Nunca
 * tira: ante cualquier error devuelve `{}` (= usar el fallback hardcodeado
 * de lib/product-names.ts para todo).
 */
export async function loadProductNameOverrides(): Promise<ProductNameOverrides> {
  const testOverride = testOverrideFromEnv()
  if (testOverride) return testOverride

  const now = Date.now()
  if (cache && now - cache.fetchedAt < TTL_MS) {
    return cache.data
  }

  try {
    const data = await fetchFromDb()
    cache = { data, fetchedAt: now }
    return data
  } catch (err) {
    console.warn(
      '[product-names-db] error inesperado, uso fallback:',
      err instanceof Error ? err.message : err,
    )
    cache = { data: {}, fetchedAt: now }
    return {}
  }
}

/** Solo para tests: resetea el cache en memoria entre casos. */
export function __resetProductNameOverridesCacheForTests(): void {
  cache = null
}
