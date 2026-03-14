import { calculateCommissionBreakdown } from '../../src/bookings/domain/commission.util'

describe('calculateCommissionBreakdown', () => {
  it('calculates commission and payout from final labor only', () => {
    expect(calculateCommissionBreakdown('799.00', 20)).toEqual({
      finalLabor: '799.00',
      commissionAmount: '159.80',
      payoutAmount: '639.20',
    })
  })

  it('throws when final labor is zero or negative', () => {
    expect(() => calculateCommissionBreakdown('0', 20)).toThrow(
      'finalLabor must be greater than zero',
    )
  })
})
