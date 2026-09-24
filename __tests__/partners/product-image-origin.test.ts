import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * lib/partners/product-image-origin.ts — gate "solo nuestros mockups" para
 * fotos de producto (Fase 2). Ver el comentario de cabecera del archivo para
 * el porqué de cada patrón aceptado.
 */

const state = vi.hoisted(() => ({
  // Filas de partner_assets que "existen" en el mock, por (tenant_id, type, public_url|storage_key)
  rows: [] as Array<{ tenant_id: string; type: string; source: string; public_url: string; storage_key: string }>,
  // true → toda query a partner_assets devuelve { error } (DB caída)
  dbDown: false,
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
        if (state.dbDown) return resolve({ data: null, error: { message: 'connection refused' } })
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

import {
  isOwnMockupUrl,
  findFirstDisallowedProductImage,
  extractColorImageUrls,
  findFirstDisallowedColorImage,
} from '@/lib/partners/product-image-origin'

const TENANT_ID = 'tenant-1'
const SLUG = 'impulso'

/** Fila de partner_assets como la escribe saveDesignAsset para un mockup del Studio. */
function studioMockupRow(key: string, tenantId = TENANT_ID) {
  return { tenant_id: tenantId, type: 'mockup', source: 'ai_generated', public_url: `/api/proxy-image?key=${encodeURIComponent(key)}`, storage_key: key }
}

beforeEach(() => {
  state.rows = []
  state.dbDown = false
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

  it('accepts a Studio mockup matched by storage_key (URL in another format, e.g. CDN)', async () => {
    state.rows.push(studioMockupRow('partners/impulso/mockups/17d3af93.png'))
    const result = await isOwnMockupUrl(
      TENANT_ID,
      SLUG,
      '/api/proxy-image?key=partners%2Fimpulso%2Fmockups%2F17d3af93.png',
    )
    expect(result.ok).toBe(true)
    expect(result.reason).toBe('db_asset')
  })

  it('REJECTS a Studio key pattern with no partner_assets row (DB is now the source of truth)', async () => {
    const result = await isOwnMockupUrl(
      TENANT_ID,
      SLUG,
      '/api/proxy-image?key=partners%2Fimpulso%2Fmockups%2F17d3af93.png',
    )
    expect(result.ok).toBe(false)
  })

  it('rejects a Studio mockup row that belongs to ANOTHER tenant', async () => {
    state.rows.push(studioMockupRow('partners/impulso/mockups/17d3af93.png', 'tenant-2'))
    const result = await isOwnMockupUrl(
      TENANT_ID,
      SLUG,
      '/api/proxy-image?key=partners%2Fimpulso%2Fmockups%2F17d3af93.png',
    )
    expect(result.ok).toBe(false)
  })

  it('accepts a mockup row even if the tenant slug changed (matched by tenant_id, not path)', async () => {
    state.rows.push(studioMockupRow('partners/nombre-viejo/mockups/17d3af93.png'))
    const result = await isOwnMockupUrl(
      TENANT_ID,
      SLUG,
      '/api/proxy-image?key=partners%2Fnombre-viejo%2Fmockups%2F17d3af93.png',
    )
    expect(result.ok).toBe(true)
    expect(result.reason).toBe('db_asset')
  })

  it('rejects a design (not mockup) row — only mockups are product photos', async () => {
    state.rows.push({ ...studioMockupRow('partners/impulso/designs/d1.png'), type: 'design' })
    const result = await isOwnMockupUrl(TENANT_ID, SLUG, '/api/proxy-image?key=partners%2Fimpulso%2Fdesigns%2Fd1.png')
    expect(result.ok).toBe(false)
  })

  describe('when the partner_assets query fails (DB down)', () => {
    beforeEach(() => {
      state.dbDown = true
      vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    it('falls back to the Studio key pattern for this tenant', async () => {
      const result = await isOwnMockupUrl(
        TENANT_ID,
        SLUG,
        '/api/proxy-image?key=partners%2Fimpulso%2Fmockups%2F17d3af93.png',
      )
      expect(result.ok).toBe(true)
      expect(result.reason).toBe('studio_key_pattern_db_down')
    })

    it('still rejects another tenant slug and external URLs', async () => {
      expect((await isOwnMockupUrl(TENANT_ID, SLUG, '/api/proxy-image?key=partners%2Fotro%2Fmockups%2Fx.png')).ok).toBe(false)
      expect((await isOwnMockupUrl(TENANT_ID, SLUG, 'https://images.unsplash.com/photo-123')).ok).toBe(false)
    })
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

  it('accepts the legacy WhatsApp-bot mockups-fallback bucket — v2/uploads/dashboard subpath', async () => {
    const result = await isOwnMockupUrl(
      TENANT_ID,
      SLUG,
      'https://fvsjvvyohaarivametxq.supabase.co/storage/v1/object/public/mockups-fallback/v2/uploads/dashboard/54911111/uuid.png',
    )
    expect(result.ok).toBe(true)
    expect(result.reason).toBe('legacy_bot_fallback')
  })

  it('accepts the legacy WhatsApp-bot mockups-fallback bucket — robot-images/mockups subpath', async () => {
    const result = await isOwnMockupUrl(
      TENANT_ID,
      SLUG,
      'https://fvsjvvyohaarivametxq.supabase.co/storage/v1/object/public/mockups-fallback/robot-images/mockups/abc.jpg',
    )
    expect(result.ok).toBe(true)
    expect(result.reason).toBe('legacy_bot_fallback')
  })

  // Verificado listando el bucket real (2026-09-23): v1/stamps son diseños
  // sueltos (no mockups compuestos) y robot-images/images son imágenes
  // genéricas del robot de posteos — ninguna de las dos es una foto de
  // prenda con estampa, así que NO deben aceptarse como "nuestro mockup".
  it('rejects mockups-fallback/v1/stamps (diseños sueltos, no mockups)', async () => {
    const result = await isOwnMockupUrl(
      TENANT_ID,
      SLUG,
      'https://fvsjvvyohaarivametxq.supabase.co/storage/v1/object/public/mockups-fallback/v1/stamps/0030b680-6fae-4054-af69-f5f32d4472f4',
    )
    expect(result.ok).toBe(false)
  })

  it('rejects mockups-fallback/robot-images/images (imágenes genéricas, no mockups)', async () => {
    const result = await isOwnMockupUrl(
      TENANT_ID,
      SLUG,
      'https://fvsjvvyohaarivametxq.supabase.co/storage/v1/object/public/mockups-fallback/robot-images/images/abc.jpg',
    )
    expect(result.ok).toBe(false)
  })

  it('rejects mockups-fallback/remove-bg (recortes sueltos, no mockups)', async () => {
    const result = await isOwnMockupUrl(
      TENANT_ID,
      SLUG,
      'https://fvsjvvyohaarivametxq.supabase.co/storage/v1/object/public/mockups-fallback/remove-bg/abc.png',
    )
    expect(result.ok).toBe(false)
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
  beforeEach(() => {
    state.rows.push(studioMockupRow('partners/impulso/mockups/a.png'))
  })

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

  // Fase 3: images[0]=frente, images[1]=dorso — gateados. images[2+]=extras
  // (lifestyle/detalle/foto real) — el partner puede subirlas libres.
  describe('extras (index >= 2) skip the "our mockup" gate', () => {
    const good = '/api/proxy-image?key=partners%2Fimpulso%2Fmockups%2Fa.png'
    const stockPhoto = 'https://images.unsplash.com/photo-lifestyle'

    it('allows a non-mockup URL at index 2+ (front/back are valid)', async () => {
      const result = await findFirstDisallowedProductImage(TENANT_ID, SLUG, [good, good, stockPhoto])
      expect(result).toBeNull()
    })

    it('allows MULTIPLE non-mockup extras from index 2 onward', async () => {
      const result = await findFirstDisallowedProductImage(
        TENANT_ID,
        SLUG,
        [good, good, stockPhoto, 'https://images.unsplash.com/photo-detail', 'https://images.unsplash.com/photo-real'],
      )
      expect(result).toBeNull()
    })

    it('STILL rejects a non-mockup front (index 0) even with valid extras after it', async () => {
      const result = await findFirstDisallowedProductImage(TENANT_ID, SLUG, [stockPhoto, good, stockPhoto])
      expect(result).toBe(stockPhoto)
    })

    it('STILL rejects a non-mockup back (index 1) even though extras are allowed', async () => {
      const result = await findFirstDisallowedProductImage(TENANT_ID, SLUG, [good, stockPhoto, stockPhoto])
      expect(result).toBe(stockPhoto)
    })
  })
})

describe('extractColorImageUrls', () => {
  it('pulls front and back URLs out of metadata.colors[]', () => {
    const colors = [
      { name: 'Negro', hex: '#000', images: { front: 'https://a/front.png', back: 'https://a/back.png' } },
      { name: 'Blanco', hex: '#fff', images: { front: 'https://b/front.png' } },
    ]
    expect(extractColorImageUrls(colors)).toEqual([
      'https://a/front.png',
      'https://a/back.png',
      'https://b/front.png',
    ])
  })

  it('ignores colors with no images / empty strings / non-array input', () => {
    expect(extractColorImageUrls([{ name: 'Rojo', hex: '#f00', images: { front: '', back: '' } }])).toEqual([])
    expect(extractColorImageUrls(null)).toEqual([])
    expect(extractColorImageUrls(undefined)).toEqual([])
    expect(extractColorImageUrls('not-an-array')).toEqual([])
  })
})

describe('findFirstDisallowedColorImage', () => {
  beforeEach(() => {
    state.rows.push(studioMockupRow('partners/impulso/mockups/a.png'))
  })

  const GOOD = '/api/proxy-image?key=partners%2Fimpulso%2Fmockups%2Fa.png'
  const BAD = 'https://images.unsplash.com/photo-123'

  it('returns null when every color image is a Studio mockup', async () => {
    const colors = [{ name: 'Negro', hex: '#000', images: { front: GOOD, back: GOOD } }]
    expect(await findFirstDisallowedColorImage(TENANT_ID, SLUG, colors)).toBeNull()
  })

  it('returns the first disallowed color image URL', async () => {
    const colors = [{ name: 'Negro', hex: '#000', images: { front: GOOD, back: BAD } }]
    expect(await findFirstDisallowedColorImage(TENANT_ID, SLUG, colors)).toBe(BAD)
  })

  it('leaves a legacy color image (already in existingColors) untouched even if it would fail today', async () => {
    const existingColors = [{ name: 'Negro', hex: '#000', images: { front: BAD } }]
    const newColors = [{ name: 'Negro', hex: '#000', images: { front: BAD } }]
    expect(await findFirstDisallowedColorImage(TENANT_ID, SLUG, newColors, existingColors)).toBeNull()
  })

  it('validates a newly-added color even when an existing legacy color is also bad', async () => {
    const legacyBad = 'https://images.unsplash.com/photo-legacy'
    const newBad = 'https://images.unsplash.com/photo-new'
    const existingColors = [{ name: 'Negro', hex: '#000', images: { front: legacyBad } }]
    const newColors = [
      { name: 'Negro', hex: '#000', images: { front: legacyBad } },
      { name: 'Blanco', hex: '#fff', images: { front: newBad } },
    ]
    expect(await findFirstDisallowedColorImage(TENANT_ID, SLUG, newColors, existingColors)).toBe(newBad)
  })
})
