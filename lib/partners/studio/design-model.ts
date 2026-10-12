/**
 * Modelo de imagen del Studio de DISEÑO (workspace del partner y Studio de su
 * tienda pública).
 *
 * Hasta el 12/10/2026 los dos caían en GEMINI_IMAGE_MODEL — una variable
 * GLOBAL de la tienda que en producción apunta a gemini-3-pro-image
 * (US$0,134/imagen): todo partner, Starter incluido, generaba con el modelo
 * más caro. Decisión de Juan (12/10, objetivo Gemini ≤ US$90/mes): flash para
 * todos y el modelo PRO reservado a los planes pagos (Growth/Pro) — hoy no
 * hay partners en esos planes, cuando haya les toca solo.
 *
 * Envs propias (no la global): GEMINI_STUDIO_DESIGN_MODEL (flash) y
 * GEMINI_STUDIO_PRO_DESIGN_MODEL (planes pagos).
 */
import type { Plan } from '@/lib/partners/types'

export const STUDIO_FLASH_DESIGN_MODEL = 'gemini-3.1-flash-image'
export const STUDIO_PRO_DESIGN_MODEL = 'gemini-3-pro-image'
const PAID_PLANS: ReadonlySet<Plan> = new Set<Plan>(['growth', 'pro'])

export function studioDesignModel(plan: Plan): string {
  if (PAID_PLANS.has(plan)) return process.env.GEMINI_STUDIO_PRO_DESIGN_MODEL?.trim() || STUDIO_PRO_DESIGN_MODEL
  return process.env.GEMINI_STUDIO_DESIGN_MODEL?.trim() || STUDIO_FLASH_DESIGN_MODEL
}
