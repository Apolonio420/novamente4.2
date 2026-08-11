// Healthcheck diario de storefronts partner (caso Orlando, 08/2026 — ver
// app/api/cron/partners/storefront-health/route.ts). Cubre la clasificación
// de las 3 categorías y, sobre todo, el corazón del chequeo HTTP: /p/<slug>
// siempre responde HTTP 200 aunque esté mostrando el 404 lógico de Next, así
// que "caída" se decide por el <title> de la respuesta, no por el status code.
import { describe, it, expect } from 'vitest'
import {
  classifyTenants,
  isExcludedTenant,
  looksLikeNotFoundPage,
  checkStorefrontHttp,
  mapWithConcurrency,
  shouldNotify,
  NOT_FOUND_TITLE,
  type TenantHealthInput,
} from './storefront-health'

function tenant(overrides: Partial<TenantHealthInput> = {}): TenantHealthInput {
  return {
    id: 'id-' + Math.random().toString(36).slice(2),
    slug: 'some-slug',
    name: 'Some Tenant',
    status: 'active',
    storefront_published: true,
    metadata: null,
    ...overrides,
  }
}

describe('isExcludedTenant', () => {
  it('excluye wod-armor explícitamente (apagada a propósito)', () => {
    expect(isExcludedTenant({ slug: 'wod-armor', metadata: null })).toBe(true)
  })

  it('NO excluye "ms" (duplicado sin apagar a propósito, sigue siendo basura a limpiar)', () => {
    expect(isExcludedTenant({ slug: 'ms', metadata: null })).toBe(false)
  })

  it('excluye por metadata.is_demo=true sin importar el slug', () => {
    expect(isExcludedTenant({ slug: 'tu-marca', metadata: { is_demo: true } })).toBe(true)
  })

  it('excluye slugs que empiezan con "test"', () => {
    expect(isExcludedTenant({ slug: 'test2', metadata: null })).toBe(true)
    expect(isExcludedTenant({ slug: 'test-250eff', metadata: null })).toBe(true)
  })

  it('NO excluye un partner real cualquiera', () => {
    expect(isExcludedTenant({ slug: 'ms-store', metadata: null })).toBe(false)
  })
})

describe('classifyTenants', () => {
  it('clasifica dead-silent: producto published + storefront_published=false', () => {
    const t = tenant({ id: 't1', slug: 'orlando', storefront_published: false })
    const { deadSilent } = classifyTenants([t], new Map([['t1', 2]]))
    expect(deadSilent).toEqual([{ slug: 'orlando', name: 'Some Tenant', publishedProducts: 2, excluded: false }])
  })

  it('NO clasifica dead-silent si storefront_published=false pero 0 productos', () => {
    const t = tenant({ id: 't1', storefront_published: false })
    const { deadSilent } = classifyTenants([t], new Map())
    expect(deadSilent).toEqual([])
  })

  it('NO clasifica dead-silent si la tienda ya está publicada', () => {
    const t = tenant({ id: 't1', storefront_published: true })
    const { deadSilent } = classifyTenants([t], new Map([['t1', 3]]))
    expect(deadSilent).toEqual([])
  })

  it('marca dead-silent excluido=true para wod-armor', () => {
    const t = tenant({ id: 't1', slug: 'wod-armor', storefront_published: false })
    const { deadSilent } = classifyTenants([t], new Map([['t1', 3]]))
    expect(deadSilent[0].excluded).toBe(true)
  })

  it('clasifica empty-storefront: publicada+activa con 0 productos', () => {
    const t = tenant({ id: 't1', slug: 'vacia', storefront_published: true, status: 'active' })
    const { emptyStorefront } = classifyTenants([t], new Map())
    expect(emptyStorefront).toEqual([{ slug: 'vacia', name: 'Some Tenant', excluded: false }])
  })

  it('NO clasifica empty-storefront si tiene productos', () => {
    const t = tenant({ id: 't1', storefront_published: true, status: 'active' })
    const { emptyStorefront } = classifyTenants([t], new Map([['t1', 1]]))
    expect(emptyStorefront).toEqual([])
  })

  it('NO clasifica empty-storefront si el tenant no está activo', () => {
    const t = tenant({ id: 't1', storefront_published: true, status: 'suspended' })
    const { emptyStorefront } = classifyTenants([t], new Map())
    expect(emptyStorefront).toEqual([])
  })

  it('incluye en liveCheckCandidates solo publicada+activa', () => {
    const live = tenant({ id: 't1', slug: 'viva', storefront_published: true, status: 'active' })
    const offline = tenant({ id: 't2', slug: 'apagada', storefront_published: false, status: 'active' })
    const suspended = tenant({ id: 't3', slug: 'suspendida', storefront_published: true, status: 'suspended' })
    const { liveCheckCandidates } = classifyTenants([live, offline, suspended], new Map())
    expect(liveCheckCandidates.map((c) => c.slug)).toEqual(['viva'])
  })

  it('caso Orlando completo: producto published + storefront_published=false → dead-silent, no aparece en liveCheckCandidates', () => {
    const orlando = tenant({ id: 't1', slug: 'orlando', name: 'Orlando', storefront_published: false, status: 'active' })
    const { deadSilent, liveCheckCandidates, emptyStorefront } = classifyTenants([orlando], new Map([['t1', 1]]))
    expect(deadSilent).toHaveLength(1)
    expect(deadSilent[0].slug).toBe('orlando')
    expect(liveCheckCandidates).toEqual([])
    expect(emptyStorefront).toEqual([])
  })
})

describe('looksLikeNotFoundPage — el corazón del chequeo HTTP', () => {
  it('detecta el marcador de not-found aunque el HTTP status haya sido 200', () => {
    const html = `<html><head><title>${NOT_FOUND_TITLE}</title></head><body>404</body></html>`
    expect(looksLikeNotFoundPage(html)).toBe(true)
  })

  it('NO marca como not-found una tienda viva con contenido real', () => {
    const html = '<html><head><title>MS Indumentaria Premium · Novamente</title></head><body>...</body></html>'
    expect(looksLikeNotFoundPage(html)).toBe(false)
  })

  it('devuelve false si no hay tag <title> en absoluto', () => {
    expect(looksLikeNotFoundPage('<html><body>sin head</body></html>')).toBe(false)
  })

  it('no confunde un título que solo contiene la palabra "Not Found" en otro contexto', () => {
    const html = '<html><head><title>Not Found in our catalog · Novamente</title></head></html>'
    expect(looksLikeNotFoundPage(html)).toBe(false)
  })
})

describe('checkStorefrontHttp — clasifica arriba/abajo end-to-end vía fetch mockeado', () => {
  const realFetch = global.fetch

  it('CRÍTICO: HTTP 200 con el marcador de not-found en el body se cuenta como CAÍDA', async () => {
    global.fetch = (async () =>
      new Response(`<html><head><title>${NOT_FOUND_TITLE}</title></head></html>`, { status: 200 })) as any

    const result = await checkStorefrontHttp('https://www.novamente.ar', 'ms', 5000)

    expect(result.up).toBe(false)
    expect(result.reason).toBe('not_found_marker')

    global.fetch = realFetch
  })

  it('HTTP 200 con contenido real se cuenta como arriba', async () => {
    global.fetch = (async () =>
      new Response('<html><head><title>MS Indumentaria · Novamente</title></head></html>', { status: 200 })) as any

    const result = await checkStorefrontHttp('https://www.novamente.ar', 'ms-store', 5000)

    expect(result.up).toBe(true)

    global.fetch = realFetch
  })

  it('un status HTTP distinto de 200 se cuenta como caída, sin mirar el body', async () => {
    global.fetch = (async () => new Response('Internal Server Error', { status: 500 })) as any

    const result = await checkStorefrontHttp('https://www.novamente.ar', 'algo-roto', 5000)

    expect(result.up).toBe(false)
    expect(result.reason).toBe('http_status')

    global.fetch = realFetch
  })

  it('un fetch que rechaza (network error) se captura y cuenta como caída, no propaga', async () => {
    global.fetch = (async () => {
      throw new Error('network unreachable')
    }) as any

    const result = await checkStorefrontHttp('https://www.novamente.ar', 'sin-red', 5000)

    expect(result.up).toBe(false)
    expect(result.reason).toBe('fetch_error')
    expect(result.detail).toContain('network unreachable')

    global.fetch = realFetch
  })
})

describe('shouldNotify — "silencio cuando todo está bien" es un requisito, no un detalle', () => {
  it('NO avisa si no hay nada accionable (caso "todo ok" de todos los días)', () => {
    expect(shouldNotify({ deadSilentActionable: 0, brokenLiveActionable: 0 })).toBe(false)
  })

  it('avisa si hay al menos una tienda muerta silenciosa accionable', () => {
    expect(shouldNotify({ deadSilentActionable: 1, brokenLiveActionable: 0 })).toBe(true)
  })

  it('avisa si hay al menos una tienda caída accionable', () => {
    expect(shouldNotify({ deadSilentActionable: 0, brokenLiveActionable: 1 })).toBe(true)
  })
})

describe('mapWithConcurrency', () => {
  it('procesa todos los items respetando el límite de concurrencia', async () => {
    let inFlight = 0
    let maxInFlight = 0
    const items = Array.from({ length: 20 }, (_, i) => i)

    const results = await mapWithConcurrency(items, 3, async (n) => {
      inFlight++
      maxInFlight = Math.max(maxInFlight, inFlight)
      await new Promise((r) => setTimeout(r, 5))
      inFlight--
      return n * 2
    })

    expect(results).toEqual(items.map((n) => n * 2))
    expect(maxInFlight).toBeLessThanOrEqual(3)
  })

  it('un item cuyo fn rechaza no impide que el caller lo capture sin tumbar el resto', async () => {
    const items = [1, 2, 3]
    const results = await mapWithConcurrency(items, 2, async (n) => {
      if (n === 2) {
        try {
          throw new Error('boom')
        } catch (e: any) {
          return { ok: false, error: e.message }
        }
      }
      return { ok: true, value: n }
    })

    expect(results).toEqual([
      { ok: true, value: 1 },
      { ok: false, error: 'boom' },
      { ok: true, value: 3 },
    ])
  })
})
