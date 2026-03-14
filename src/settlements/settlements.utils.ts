import type { SettlementBooking } from './settlements.repository'

export function buildSettlementSummary(bookings: SettlementBooking[]) {
  const grouped = new Map<
    string,
    {
      vendorId: string
      vendorName: string
      vendorPhone: string | null
      bookingCount: number
      finalLaborTotal: number
      commissionTotal: number
      payoutTotal: number
      bookings: Array<{
        id: string
        bookingCode: string
        customerName: string
        finalLabor: string
        commissionAmount: string
        payoutAmount: string
        completedAt: string | null
      }>
    }
  >()

  for (const booking of bookings) {
    const assignment = booking.assignments[0]

    if (!assignment) {
      continue
    }

    const existing = grouped.get(assignment.vendorId) ?? {
      vendorId: assignment.vendorId,
      vendorName: assignment.vendor.user.name,
      vendorPhone: assignment.vendor.user.phone,
      bookingCount: 0,
      finalLaborTotal: 0,
      commissionTotal: 0,
      payoutTotal: 0,
      bookings: [],
    }

    existing.bookingCount += 1
    existing.finalLaborTotal += Number(booking.finalLabor ?? 0)
    existing.commissionTotal += Number(booking.commissionAmount ?? 0)
    existing.payoutTotal += Number(booking.payoutAmount ?? 0)
    existing.bookings.push({
      id: booking.id,
      bookingCode: booking.bookingCode,
      customerName: booking.customerUser?.name ?? booking.guestName ?? 'Guest Customer',
      finalLabor: Number(booking.finalLabor ?? 0).toFixed(2),
      commissionAmount: Number(booking.commissionAmount ?? 0).toFixed(2),
      payoutAmount: Number(booking.payoutAmount ?? 0).toFixed(2),
      completedAt: booking.completedAt?.toISOString() ?? null,
    })

    grouped.set(assignment.vendorId, existing)
  }

  return Array.from(grouped.values()).map((entry) => ({
    ...entry,
    finalLaborTotal: entry.finalLaborTotal.toFixed(2),
    commissionTotal: entry.commissionTotal.toFixed(2),
    payoutTotal: entry.payoutTotal.toFixed(2),
  }))
}

export function buildSettlementCsv(summary: ReturnType<typeof buildSettlementSummary>) {
  const lines = [
    'vendorId,vendorName,vendorPhone,bookingCode,customerName,finalLabor,commissionAmount,payoutAmount,completedAt',
  ]

  for (const vendor of summary) {
    for (const booking of vendor.bookings) {
      lines.push(
        [
          vendor.vendorId,
          escapeCsv(vendor.vendorName),
          escapeCsv(vendor.vendorPhone ?? ''),
          booking.bookingCode,
          escapeCsv(booking.customerName),
          booking.finalLabor,
          booking.commissionAmount,
          booking.payoutAmount,
          booking.completedAt ?? '',
        ].join(','),
      )
    }
  }

  return lines.join('\n')
}

function escapeCsv(value: string) {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }

  return value
}
