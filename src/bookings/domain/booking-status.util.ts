import { BookingStatus } from '@prisma/client'
import { AppException } from '../../common/exceptions/app.exception'

const allowedTransitions: Record<BookingStatus, BookingStatus[]> = {
  [BookingStatus.NEW]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED, BookingStatus.ASSIGNED],
  [BookingStatus.CONFIRMED]: [BookingStatus.ASSIGNED, BookingStatus.CANCELLED],
  [BookingStatus.ASSIGNED]: [
    BookingStatus.IN_PROGRESS,
    BookingStatus.COMPLETED,
    BookingStatus.CANCELLED,
  ],
  [BookingStatus.IN_PROGRESS]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
  [BookingStatus.COMPLETED]: [],
  [BookingStatus.CANCELLED]: [],
}

export function assertBookingStatusTransition(
  currentStatus: BookingStatus,
  nextStatus: BookingStatus,
): void {
  if (currentStatus === nextStatus) {
    return
  }

  if (!allowedTransitions[currentStatus].includes(nextStatus)) {
    throw new AppException(
      'BOOKING_STATUS_TRANSITION_INVALID',
      `Cannot move booking from ${currentStatus} to ${nextStatus}.`,
    )
  }
}

export function canCustomerCancel(status: BookingStatus): boolean {
  return ([BookingStatus.NEW, BookingStatus.CONFIRMED] as BookingStatus[]).includes(status)
}

export function canCompleteBooking(status: BookingStatus): boolean {
  return ([BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS] as BookingStatus[]).includes(status)
}
