// Regla compartida de auto-publish del storefront (ver lib/partners/auto-publish.ts).
// Antes solo vivia en app/api/partners/branding/route.ts (caso DUB SHIRTS). El caso
// Orlando (08/2026) mostro que un partner que carga branding en el ONBOARDING y
// despues publica productos sin volver a /workspace/branding nunca disparaba esa
// regla y quedaba con storefront_published=false invisible en /p/<slug> por un mes
// sin ningun aviso. Este archivo cubre el helper que ahora comparten AMBOS endpoints.
import { describe, it, expect } from 'vitest'
import {
  hasMinimumBranding,
  isHiddenManually,
  computeAutoPublishUpdates,
  computeStorefrontHiddenReason,
} from './auto-publish'

function tenant(overrides: Partial<{
  logo_url: string | null
  banner_url: string | null
  tagline: string | null
  about_text: string | null
  storefront_published: boolean
  status: string
  metadata: Record<string, unknown> | null
}> = {}) {
  return {
    logo_url: null,
    banner_url: null,
    tagline: null,
    about_text: null,
    storefront_published: false,
    status: 'onboarding',
    metadata: null,
    ...overrides,
  } as any
}

describe('hasMinimumBranding', () => {
  it('logo + banner → true', () => {
    expect(hasMinimumBranding(tenant({ logo_url: 'x', banner_url: 'y' }))).toBe(true)
  })
  it('logo + tagline → true', () => {
    expect(hasMinimumBranding(tenant({ logo_url: 'x', tagline: 'Somos una marca' }))).toBe(true)
  })
  it('logo + about_text → true', () => {
    expect(hasMinimumBranding(tenant({ logo_url: 'x', about_text: 'Sobre nosotros' }))).toBe(true)
  })
  it('sin logo → false aunque tenga banner/tagline/about_text', () => {
    expect(hasMinimumBranding(tenant({ banner_url: 'y', tagline: 'z', about_text: 'w' }))).toBe(false)
  })
  it('solo logo, sin banner/tagline/about_text → false', () => {
    expect(hasMinimumBranding(tenant({ logo_url: 'x' }))).toBe(false)
  })
})

describe('computeAutoPublishUpdates', () => {
  it('branding minimo + tienda apagada + onboarding → publica y activa', () => {
    const updates = computeAutoPublishUpdates(
      tenant({ logo_url: 'x', tagline: 'y', storefront_published: false, status: 'onboarding' }),
    )
    expect(updates).toEqual({ storefront_published: true, status: 'active' })
  })

  it('branding minimo + tienda apagada + status YA active → publica sin tocar status', () => {
    const updates = computeAutoPublishUpdates(
      tenant({ logo_url: 'x', tagline: 'y', storefront_published: false, status: 'active' }),
    )
    expect(updates).toEqual({ storefront_published: true })
  })

  it('sin branding minimo → null (no publica)', () => {
    const updates = computeAutoPublishUpdates(
      tenant({ logo_url: null, storefront_published: false, status: 'onboarding' }),
    )
    expect(updates).toBeNull()
  })

  it('tienda ya publicada y activa → null (nada que hacer, no re-escribe)', () => {
    const updates = computeAutoPublishUpdates(
      tenant({ logo_url: 'x', tagline: 'y', storefront_published: true, status: 'active' }),
    )
    expect(updates).toBeNull()
  })

  it('storefront_published=true aunque status no sea active (ej. paused a proposito) → null, nunca re-escribe una tienda ya publicada', () => {
    // El gate es storefront_published===false a secas — un tenant pausado o
    // suspendido a proposito (con storefront_published todavia true en DB)
    // nunca debe ser tocado por el auto-publish.
    const updates = computeAutoPublishUpdates(
      tenant({ logo_url: 'x', tagline: 'y', storefront_published: true, status: 'paused' }),
    )
    expect(updates).toBeNull()
  })

  it('sin branding minimo y tienda ya publicada → null', () => {
    const updates = computeAutoPublishUpdates(
      tenant({ storefront_published: true, status: 'active' }),
    )
    expect(updates).toBeNull()
  })

  // Caso pedido por el dueño tras el hallazgo Orlando: si el partner apago la
  // tienda A PROPOSITO desde Configuracion (metadata.storefront_hidden_manually),
  // publicar un producto o editar branding NO debe volver a prenderla sola.
  it('branding minimo + tienda apagada + apagado MANUAL → null, no la republica', () => {
    const updates = computeAutoPublishUpdates(
      tenant({
        logo_url: 'x',
        tagline: 'y',
        storefront_published: false,
        status: 'active',
        metadata: { storefront_hidden_manually: true, subscription_type: 'recurring' },
      }),
    )
    expect(updates).toBeNull()
  })

  it('branding minimo + tienda apagada + metadata SIN la marca (o null) → publica normal', () => {
    expect(
      computeAutoPublishUpdates(
        tenant({ logo_url: 'x', tagline: 'y', storefront_published: false, metadata: null }),
      ),
    ).toEqual({ storefront_published: true, status: 'active' })
    expect(
      computeAutoPublishUpdates(
        tenant({
          logo_url: 'x',
          tagline: 'y',
          storefront_published: false,
          metadata: { subscription_type: 'recurring' },
        }),
      ),
    ).toEqual({ storefront_published: true, status: 'active' })
  })
})

describe('isHiddenManually', () => {
  it('metadata.storefront_hidden_manually === true → true', () => {
    expect(isHiddenManually({ storefront_hidden_manually: true })).toBe(true)
  })
  it('metadata sin la clave → false', () => {
    expect(isHiddenManually({ subscription_type: 'recurring' })).toBe(false)
  })
  it('metadata null/undefined → false (no explota)', () => {
    expect(isHiddenManually(null)).toBe(false)
    expect(isHiddenManually(undefined)).toBe(false)
  })
  it('valor truthy pero no === true (ej. string "true") → false, exige booleano estricto', () => {
    expect(isHiddenManually({ storefront_hidden_manually: 'true' as any })).toBe(false)
  })
})

// Motivo que el banner del workspace muestra al partner (app/workspace/page.tsx)
// para explicar por que su tienda no es visible, en vez de un aviso generico.
describe('computeStorefrontHiddenReason', () => {
  it('tienda ya publicada → null (nada que explicar)', () => {
    expect(
      computeStorefrontHiddenReason(tenant({ logo_url: 'x', tagline: 'y', storefront_published: true })),
    ).toBeNull()
  })

  it('apagado manual tiene PRIORIDAD sobre branding incompleto — no regañamos por branding si fue decision del partner', () => {
    const reason = computeStorefrontHiddenReason(
      tenant({
        logo_url: null, // branding tambien incompleto
        storefront_published: false,
        metadata: { storefront_hidden_manually: true },
      }),
    )
    expect(reason).toBe('hidden_manually')
  })

  it('sin logo (branding incompleto, no oculto a proposito) → missing_logo', () => {
    const reason = computeStorefrontHiddenReason(
      tenant({ logo_url: null, banner_url: 'x', storefront_published: false }),
    )
    expect(reason).toBe('missing_logo')
  })

  it('con logo pero sin banner/tagline/about_text → missing_cover_or_description', () => {
    const reason = computeStorefrontHiddenReason(
      tenant({ logo_url: 'x', banner_url: null, tagline: null, about_text: null, storefront_published: false }),
    )
    expect(reason).toBe('missing_cover_or_description')
  })

  it('branding minimo completo, no oculto a proposito, tienda apagada → ready_not_published', () => {
    const reason = computeStorefrontHiddenReason(
      tenant({ logo_url: 'x', tagline: 'y', storefront_published: false }),
    )
    expect(reason).toBe('ready_not_published')
  })
})
