import { describe, expect, it } from 'vitest'
import { isClearlyStagingUrl, validateStagingEnvironment } from '../../scripts/verify-partners-os-staging'

const validEnvironment = {
  PARTNERS_STAGING_SUPABASE_URL: 'https://project-staging.supabase.co',
  PARTNERS_STAGING_SERVICE_ROLE_KEY: 'service-role-test-key',
  PARTNERS_STAGING_ANON_KEY: 'anon-test-key',
  PARTNERS_STAGING_BASE_URL: 'https://partners-preview.example.test',
  PARTNERS_STAGING_CONFIRM: 'RUN_PARTNERS_OS_ACCEPTANCE',
}

describe('Partners OS staging acceptance environment guard', () => {
  it('accepts only explicitly confirmed staging configuration', () => {
    const result = validateStagingEnvironment(validEnvironment)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.config.baseUrl).toBe('https://partners-preview.example.test')
  })

  it('does not accept production-looking URLs or a missing confirmation', () => {
    const result = validateStagingEnvironment({
      ...validEnvironment,
      PARTNERS_STAGING_SUPABASE_URL: 'https://project.supabase.co',
      PARTNERS_STAGING_BASE_URL: 'https://partners.example.com',
      PARTNERS_STAGING_CONFIRM: undefined,
    })
    expect(result.ok).toBe(false)
    if ('errors' in result) {
      expect(result.errors.join(' ')).toContain('PARTNERS_STAGING_CONFIRM')
      expect(result.errors.join(' ')).toContain('PARTNERS_STAGING_SUPABASE_URL')
      expect(result.errors.join(' ')).toContain('PARTNERS_STAGING_BASE_URL')
    }
  })

  it('accepts local development URLs and rejects malformed values', () => {
    expect(isClearlyStagingUrl('http://localhost:3000')).toBe(true)
    expect(isClearlyStagingUrl('https://api.dev.example.test')).toBe(true)
    expect(isClearlyStagingUrl('not-a-url')).toBe(false)
  })
})
