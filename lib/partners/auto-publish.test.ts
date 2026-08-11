// Regla compartida de auto-publish del storefront (ver lib/partners/auto-publish.ts).
// Antes solo vivia en app/api/partners/branding/route.ts (caso DUB SHIRTS). El caso
// Orlando (08/2026) mostro que un partner que carga branding en el ONBOARDING y
// despues publica productos sin volver a /workspace/branding nunca disparaba esa
// regla y quedaba con storefront_published=false invisible en /p/<slug> por un mes
// sin ningun aviso. Este archivo cubre el helper que ahora comparten AMBOS endpoints.
import { describe, it, expect } from 'vitest'
import { hasMinimumBranding, computeAutoPublishUpdates } from './auto-publish'

function tenant(overrides: Partial<{
  logo_url: string | null
  banner_url: string | null
  tagline: string | null
  about_text: string | null
  storefront_published: boolean
  status: string
}> = {}) {
  return {
    logo_url: null,
    banner_url: null,
    tagline: null,
    about_text: null,
    storefront_published: false,
    status: 'onboarding',
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
})
