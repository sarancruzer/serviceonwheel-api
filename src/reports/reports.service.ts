import { Injectable } from '@nestjs/common'
import { getIsoWeekString } from '../common/utils/week.util'
import { ReportsRepository } from './reports.repository'
import { ReportSummaryQueryDto } from './dto/reports.dto'

@Injectable()
export class ReportsService {
  constructor(private readonly reportsRepository: ReportsRepository) {}

  async getSummary(query: ReportSummaryQueryDto) {
    const dateTo = query.dateTo ? new Date(query.dateTo) : new Date()
    const dateFrom = query.dateFrom
      ? new Date(query.dateFrom)
      : new Date(dateTo.getTime() - 30 * 24 * 60 * 60 * 1000)

    const bookings = await this.reportsRepository.listBookingsForSummary(dateFrom, dateTo)
    const daily = new Map<string, SummaryBucket>()
    const weekly = new Map<string, SummaryBucket>()

    let bookingsCreated = 0
    let bookingsCompleted = 0
    let bookingsCancelled = 0
    let revenue = 0
    let commissions = 0

    for (const booking of bookings) {
      const createdKey = booking.createdAt.toISOString().slice(0, 10)
      const createdWeekKey = getIsoWeekString(booking.createdAt)
      updateBucket(daily, createdKey, 'newBookings', 1)
      updateBucket(weekly, createdWeekKey, 'newBookings', 1)
      bookingsCreated += 1

      if (booking.completedAt) {
        const completedKey = booking.completedAt.toISOString().slice(0, 10)
        const completedWeekKey = getIsoWeekString(booking.completedAt)
        updateBucket(daily, completedKey, 'completedBookings', 1)
        updateBucket(weekly, completedWeekKey, 'completedBookings', 1)
        updateBucket(daily, completedKey, 'revenue', Number(booking.finalLabor ?? 0))
        updateBucket(weekly, completedWeekKey, 'revenue', Number(booking.finalLabor ?? 0))
        updateBucket(daily, completedKey, 'commissions', Number(booking.commissionAmount ?? 0))
        updateBucket(weekly, completedWeekKey, 'commissions', Number(booking.commissionAmount ?? 0))
        bookingsCompleted += 1
        revenue += Number(booking.finalLabor ?? 0)
        commissions += Number(booking.commissionAmount ?? 0)
      }

      if (booking.cancelledAt) {
        const cancelledKey = booking.cancelledAt.toISOString().slice(0, 10)
        const cancelledWeekKey = getIsoWeekString(booking.cancelledAt)
        updateBucket(daily, cancelledKey, 'cancelledBookings', 1)
        updateBucket(weekly, cancelledWeekKey, 'cancelledBookings', 1)
        bookingsCancelled += 1
      }
    }

    return {
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
      totals: {
        bookingsCreated,
        bookingsCompleted,
        bookingsCancelled,
        revenue: revenue.toFixed(2),
        commissions: commissions.toFixed(2),
      },
      daily: serializeBuckets(daily),
      weekly: serializeBuckets(weekly),
    }
  }
}

type SummaryBucket = {
  period: string
  newBookings: number
  completedBookings: number
  cancelledBookings: number
  revenue: number
  commissions: number
}

function updateBucket(
  collection: Map<string, SummaryBucket>,
  key: string,
  field: keyof Omit<SummaryBucket, 'period'>,
  increment: number,
) {
  const existing = collection.get(key) ?? {
    period: key,
    newBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    revenue: 0,
    commissions: 0,
  }

  existing[field] += increment
  collection.set(key, existing)
}

function serializeBuckets(collection: Map<string, SummaryBucket>) {
  return Array.from(collection.values())
    .sort((left, right) => left.period.localeCompare(right.period))
    .map((value) => ({
      period: value.period,
      newBookings: value.newBookings,
      completedBookings: value.completedBookings,
      cancelledBookings: value.cancelledBookings,
      revenue: value.revenue.toFixed(2),
      commissions: value.commissions.toFixed(2),
    }))
}
