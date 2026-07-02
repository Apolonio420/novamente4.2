import { afterEach, describe, expect, it } from 'vitest'
import { isPartnersFeatureEnabled } from '@/lib/partners/feature-flags'

const originalNodeEnv = process.env.NODE_ENV
const flagNames = [
  'NEXT_PUBLIC_PARTNERS_CRM_ENABLED',
  'NEXT_PUBLIC_PARTNERS_COCKPIT_ENABLED',
  'NEXT_PUBLIC_PARTNERS_FULFILLMENT_ENABLED',
] as const

function setNodeEnv(value: string | undefined) {
  if (value === undefined) {
    delete (process.env as Record<string, string | undefined>).NODE_ENV
    return
  }
  Reflect.set(process.env, 'NODE_ENV', value)
}

function resetFlags() {
  setNodeEnv(originalNodeEnv)
  for (const name of flagNames) delete process.env[name]
}

afterEach(resetFlags)

describe('Partner rollout feature flags', () => {
  it('enables features by default outside production unless explicitly disabled', () => {
    setNodeEnv('development')
    expect(isPartnersFeatureEnabled('crm')).toBe(true)

    process.env.NEXT_PUBLIC_PARTNERS_CRM_ENABLED = 'false'
    expect(isPartnersFeatureEnabled('crm')).toBe(false)
  })

  it('requires an explicit true value in production', () => {
    setNodeEnv('production')
    expect(isPartnersFeatureEnabled('cockpit')).toBe(false)

    process.env.NEXT_PUBLIC_PARTNERS_COCKPIT_ENABLED = 'true'
    expect(isPartnersFeatureEnabled('cockpit')).toBe(true)
  })

  it('treats unsupported values as the environment default', () => {
    setNodeEnv('development')
    process.env.NEXT_PUBLIC_PARTNERS_FULFILLMENT_ENABLED = 'enabled'
    expect(isPartnersFeatureEnabled('fulfillment')).toBe(true)

    setNodeEnv('production')
    expect(isPartnersFeatureEnabled('fulfillment')).toBe(false)
  })
})
