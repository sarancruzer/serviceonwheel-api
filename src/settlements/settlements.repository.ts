import { Injectable } from '@nestjs/common'
import { AssignmentStatus, Prisma, SettlementStatus } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

const settlementBookingInclude = {
  customerUser: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  },
  assignments: {
    include: {
      vendor: {
        include: {
          user: true,
        },
      },
    },
    where: {
      assignmentStatus: {
        in: [AssignmentStatus.ASSIGNED, AssignmentStatus.ACCEPTED],
      },
    },
    orderBy: {
      assignedAt: 'desc',
    },
  },
} satisfies Prisma.BookingInclude

export type SettlementBooking = Prisma.BookingGetPayload<{
  include: typeof settlementBookingInclude
}>

@Injectable()
export class SettlementsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listSettlementBookings(filters: {
    week: string
    status?: SettlementStatus
    vendorId?: string
  }): Promise<SettlementBooking[]> {
    return this.prisma.booking.findMany({
      where: {
        settlementWeek: filters.week,
        settlementStatus: filters.status,
        assignments: filters.vendorId
          ? {
              some: {
                vendorId: filters.vendorId,
                assignmentStatus: {
                  in: [AssignmentStatus.ASSIGNED, AssignmentStatus.ACCEPTED],
                },
              },
            }
          : {
              some: {
                assignmentStatus: {
                  in: [AssignmentStatus.ASSIGNED, AssignmentStatus.ACCEPTED],
                },
              },
            },
      },
      include: settlementBookingInclude,
      orderBy: {
        completedAt: 'desc',
      },
    })
  }

  async markSettled(ids: string[], settlementRef: string, settledAt: Date) {
    if (ids.length === 0) {
      return 0
    }

    const result = await this.prisma.booking.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: {
        settlementStatus: SettlementStatus.SETTLED,
        settlementRef,
        settlementDate: settledAt,
      },
    })

    return result.count
  }
}
