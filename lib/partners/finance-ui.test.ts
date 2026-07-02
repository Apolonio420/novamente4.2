import { describe, expect, it } from 'vitest'
import { PAYOUT_BADGE } from './finance-ui'

describe('PAYOUT_BADGE', () => {
  it('renders the processing payout state without an undefined badge', () => {
    expect(PAYOUT_BADGE.processing).toEqual(expect.objectContaining({ label: 'En proceso' }))
  })
})
