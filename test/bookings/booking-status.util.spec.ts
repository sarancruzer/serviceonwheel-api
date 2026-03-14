import { BookingStatus } from '@prisma/client'
import {
  assertBookingStatusTransition,
  canCompleteBooking,
  canCustomerCancel,
} from '../../src/bookings/domain/booking-status.util'

describe('booking status rules', () => {
  it('allows valid transition chains', () => {
    expect(() =>
      assertBookingStatusTransition(BookingStatus.NEW, BookingStatus.CONFIRMED),
    ).not.toThrow()

    expect(() =>
      assertBookingStatusTransition(BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS),
    ).not.toThrow()
  })

  it('rejects invalid transitions', () => {
    expect(() => assertBookingStatusTransition(BookingStatus.NEW, BookingStatus.COMPLETED)).toThrow(
      'Cannot move booking',
    )
  })

  it('enforces customer cancellation and completion predicates', () => {
    expect(canCustomerCancel(BookingStatus.NEW)).toBe(true)
    expect(canCustomerCancel(BookingStatus.ASSIGNED)).toBe(false)
    expect(canCompleteBooking(BookingStatus.ASSIGNED)).toBe(true)
    expect(canCompleteBooking(BookingStatus.CONFIRMED)).toBe(false)
  })
})
