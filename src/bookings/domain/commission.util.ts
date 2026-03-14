import { centsToMoney, moneyToCents } from '../../common/utils/currency.util'

export function calculateCommissionBreakdown(
  finalLabor: string | number,
  commissionRatePct: number,
) {
  const finalLaborCents = moneyToCents(finalLabor)

  if (finalLaborCents <= 0) {
    throw new Error('finalLabor must be greater than zero')
  }

  const commissionAmountCents = Math.round((finalLaborCents * commissionRatePct) / 100)
  const payoutAmountCents = finalLaborCents - commissionAmountCents

  return {
    finalLabor: centsToMoney(finalLaborCents),
    commissionAmount: centsToMoney(commissionAmountCents),
    payoutAmount: centsToMoney(payoutAmountCents),
  }
}
