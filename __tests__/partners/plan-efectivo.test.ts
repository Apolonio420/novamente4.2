/**
 * Qué pierde un partner que deja de pagar (decisión de Juan, 27/08/2026):
 * lo que dice /studio/planes — o sea, cae a Starter.
 *
 * Antes no perdía nada. El cron de suscripciones lo suspendía
 * (status='suspended') sin tocar `plan`, y como todos los gates preguntan por
 * `tenant.plan`, seguía con generaciones de IA ilimitadas, analytics, feeds y
 * chatbot. Novamente pagaba la factura de Gemini de alguien que ya no pagaba.
 */
import { describe, it, expect } from 'vitest'
import { effectivePlan, featuresDelTenant, PLAN_FEATURES } from '@/lib/partners/plans'

describe('plan efectivo según el estado de la cuenta', () => {
  it('al día, usa el plan que contrató', () => {
    expect(effectivePlan({ plan: 'growth', status: 'active' })).toBe('growth')
    expect(effectivePlan({ plan: 'pro', status: 'active' })).toBe('pro')
  })

  it('el que está entrando (onboarding) cuenta como al día', () => {
    expect(effectivePlan({ plan: 'growth', status: 'onboarding' })).toBe('growth')
  })

  it('suspendido por falta de pago cae a Starter', () => {
    expect(effectivePlan({ plan: 'pro', status: 'suspended' })).toBe('starter')
    expect(effectivePlan({ plan: 'growth', status: 'suspended' })).toBe('starter')
  })

  it('el que canceló también', () => {
    expect(effectivePlan({ plan: 'growth', status: 'paused' })).toBe('starter')
  })

  it('lo que concretamente pierde: la IA deja de ser ilimitada', () => {
    const alDia = featuresDelTenant({ plan: 'growth', status: 'active' })
    const cortado = featuresDelTenant({ plan: 'growth', status: 'suspended' })
    expect(alDia.maxProducts).toBe(999999)
    expect(cortado.maxProducts).toBe(10)          // el tope de Starter
    expect(alDia.seoIndexable).toBe(true)
    expect(cortado.seoIndexable).toBe(false)
    expect(cortado.analytics).toBe('none')
  })

  it('un Pro suspendido pierde chatbot, feeds y soporte', () => {
    const f = featuresDelTenant({ plan: 'pro', status: 'suspended' })
    expect(f.chatbot).toBe(false)
    expect(f.feedExport).toBe(false)
    expect(f.supportLevel).toBe('none')
  })

  it('conserva lo que Starter sí promete', () => {
    const f = featuresDelTenant({ plan: 'pro', status: 'suspended' })
    expect(f.brandingFull).toBe(true)             // su tienda sigue con su marca
    expect(f.maxLeadsPerMonth).toBe(PLAN_FEATURES.starter.maxLeadsPerMonth)
  })

  it('`plan` no se pisa: se conserva para poder reactivar', () => {
    const tenant = { plan: 'pro' as const, status: 'suspended' }
    expect(effectivePlan(tenant)).toBe('starter')
    expect(tenant.plan).toBe('pro')
  })

  it('un plan raro o vacío no rompe: cae a Starter', () => {
    expect(effectivePlan({ plan: 'inventado', status: 'active' })).toBe('starter')
  })
})
