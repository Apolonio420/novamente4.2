import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * lib/partners/product-image-origin.ts — gate "solo nuestros mockups" para
 * fotos de producto (Fase 2). Ver el comentario de cabecera del archivo para
 * el porqué de cada patrón aceptado.
 */

const state = vi.hoisted(() => ({
  // Filas de partner_assets que "existen" en el mock, por (tenant_id, type, public_url|storage_key)
  rows: [] as Array<{ tenant_id: string; type: string; source: string; public_url: string; storage_key: string }>,
}))

vi.mock('@/lib/supabase-admin', () => {
  // Cada `db().from(...)` arranca una query NUEVA con sus propios filtros —
  // asi `base()` (en el codigo fuente) puede crear una query terminada en
  // `.limit(...)` y el llamador seguir encadenando `.eq(...)` antes de
  // awaitear, tal como hace supabase-js de verdad.
  function makeQuery() {
    const filters: Record<string, unknown> = {}
    const neqFilters: Record<string, unknown> = {}
    const query: any = {
      from() { return query },
      select() { return query },
      eq(col: string, val: unknown) {
        filters[col] = val
        return query
      },
      neq(col: string, val: unknown) {
        neqFilters[col] = val
        return query
      },
      limit() { return query },
      then(resolve: (v: unknown) => void) {
        const matches = state.rows.filter((r) => {
          for (const [k, v] of Object.entries(filters)) {
            if ((r as any)[k] !== v) return false
          }
          for (const [k, v] of Object.entries(neqFilters)) {
            if ((r as any)[k] === v) return false
          }
          return true
        })
        resolve({ data: matches, error: null })
      },
    }
    return query
  }
  return { supabaseAdmin: { from: () => makeQuery() } }
})

import { isOwnMockupUrl, findFirstDisallowedProductImage } from '@/lib/partners/product-image-origin'

const TENANT_ID = 'tenant-1'
const SLUG = 'impulso'

beforeEach(() => {
  state.rows = []
})

describe('isOwnMockupUrl', () => {
  it('accepts a URL matching a partner_assets mockup row for the tenant', async () => {
    state.rows.push({
      tenant_id: TENANT_ID,
      type: 'mockup',
      source: 'ai_generated',
      public_url: 'https://cdn.example.com/partners/impulso/mockups/abc.png',
      storage_key: 'partners/impulso/mockups/abc.png',
    })
    const result = await isOwnMockupUrl(TENANT_ID, SLUG, 'https://cdn.example.com/partners/impulso/mockups/abc.png')
    expect(result.ok).toBe(true)
    expect(result.reason).toBe('db_asset')
  })

  it('rejects a partner_assets row whose source is "uploaded" even if type=mockup', async () => {
    state.rows.push({
      tenant_id: TENANT_ID,
      type: 'mockup',
      source: 'uploaded',
      public_url: 'https://cdn.example.com/x.png',
      storage_key: 'x.png',
    })
    const result = await isOwnMockupUrl(TENANT_ID, SLUG, 'https://cdn.example.com/x.png')
    expect(result.ok).toBe(false)
  })

  it('accepts the Studio compositor key pattern for this tenant, even with no DB row', async () => {
    const result = await isOwnMockupUrl(
      TENANT_ID,
      SLUG,
      '/api/proxy-image?key=partners%2Fimpulso%2Fmockups%2F17d3af93.png',
    )
    expect(result.ok).toBe(true)
    expect(result.reason).toBe('studio_key_pattern')
  })

  it('rejects the Studio compositor key pattern for a DIFFERENT tenant slug', async () => {
    const result = await isOwnMockupUrl(
      TENANT_ID,
      SLUG,
      '/api/proxy-image?key=partners%2Fotro-tenant%2Fmockups%2F17d3af93.png',
    )
    expect(result.ok).toBe(false)
  })

  it('accepts the legacy curated-mockups bucket path scoped to the tenant slug', async () => {
    const result = await isOwnMockupUrl(
      TENANT_ID,
      SLUG,
      'https://fvsjvvyohaarivametxq.supabase.co/storage/v1/object/public/images/mockups/impulso/2_aldea_negra_escudo.jpg',
    )
    expect(result.ok).toBe(true)
    expect(result.reason).toBe('legacy_curated')
  })

  it('accepts the legacy WhatsApp-bot mockups-fallback bucket', async () => {
    const result = await isOwnMockupUrl(
      TENANT_ID,
      SLUG,
      'https://fvsjvvyohaarivametxq.supabase.co/storage/v1/object/public/mockups-fallback/v2/uploads/dashboard/54911111/uuid.png',
    )
    expect(result.ok).toBe(true)
    expect(result.reason).toBe('legacy_bot_fallback')
  })

  it('rejects a free upload from the partner-assets bucket (type=product path)', async () => {
    const result = await isOwnMockupUrl(
      TENANT_ID,
      SLUG,
      'https://fvsjvvyohaarivametxq.supabase.co/storage/v1/object/public/partner-assets/tenant-1/product/123.png',
    )
    expect(result.ok).toBe(false)
  })

  it('rejects an arbitrary external URL (e.g. Unsplash stock photo)', async () => {
    const result = await isOwnMockupUrl(TENANT_ID, SLUG, 'https://images.unsplash.com/photo-123')
    expect(result.ok).toBe(false)
  })

  it('rejects empty/non-string input', async () => {
    expect((await isOwnMockupUrl(TENANT_ID, SLUG, '')).ok).toBe(false)
  })
})

describe('findFirstDisallowedProductImage', () => {
  it('returns null when all images are allowed', async () => {
    const images = ['/api/proxy-image?key=partners%2Fimpulso%2Fmockups%2Fa.png']
    const bad = await findFirstDisallowedProductImage(TENANT_ID, SLUG, images)
    expect(bad).toBeNull()
  })

  it('returns the first disallowed image', async () => {
    const good = '/api/proxy-image?key=partners%2Fimpulso%2Fmockups%2Fa.png'
    const bad = 'https://images.unsplash.com/photo-123'
    const result = await findFirstDisallowedProductImage(TENANT_ID, SLUG, [good, bad])
    expect(result).toBe(bad)
  })

  it('skips URLs already present in existingUrls (legacy products stay editable)', async () => {
    const legacyBad = 'https://images.unsplash.com/photo-legacy'
    const result = await findFirstDisallowedProductImage(TENANT_ID, SLUG, [legacyBad], [legacyBad])
    expect(result).toBeNull()
  })

  it('still validates a NEW url even when an existing legacy bad url is also present', async () => {
    const legacyBad = 'https://images.unsplash.com/photo-legacy'
    const newBad = 'https://images.unsplash.com/photo-new'
    const result = await findFirstDisallowedProductImage(TENANT_ID, SLUG, [legacyBad, newBad], [legacyBad])
    expect(result).toBe(newBad)
  })
})
