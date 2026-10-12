import { describe, it, expect, afterEach } from 'vitest'
import { studioDesignModel, STUDIO_FLASH_DESIGN_MODEL, STUDIO_PRO_DESIGN_MODEL } from '@/lib/partners/studio/design-model'

describe('studioDesignModel — flash para todos, pro solo planes pagos (Juan 12/10/2026)', () => {
  const saved = { ...process.env }
  afterEach(() => { process.env = { ...saved } })

  it('Starter usa flash aunque la env GLOBAL GEMINI_IMAGE_MODEL diga pro (el bug: todo partner generaba con pro)', () => {
    process.env.GEMINI_IMAGE_MODEL = 'gemini-3-pro-image'
    process.env.GEMINI_DESIGN_MODEL = ''
    expect(studioDesignModel('starter')).toBe(STUDIO_FLASH_DESIGN_MODEL)
  })
  it('Growth y Pro usan el modelo pro', () => {
    expect(studioDesignModel('growth')).toBe(STUDIO_PRO_DESIGN_MODEL)
    expect(studioDesignModel('pro')).toBe(STUDIO_PRO_DESIGN_MODEL)
  })
  it('envs propias del Studio pisan los defaults', () => {
    process.env.GEMINI_STUDIO_DESIGN_MODEL = 'gemini-2.5-flash-image'
    process.env.GEMINI_STUDIO_PRO_DESIGN_MODEL = 'gemini-3-pro-image-preview'
    expect(studioDesignModel('starter')).toBe('gemini-2.5-flash-image')
    expect(studioDesignModel('growth')).toBe('gemini-3-pro-image-preview')
  })
})
