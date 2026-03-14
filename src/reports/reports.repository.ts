import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listBookingsForSummary(dateFrom: Date, dateTo: Date) {
    return this.prisma.booking.findMany({
      where: {
        OR: [
          {
            createdAt: {
              gte: dateFrom,
              lte: dateTo,
            },
          },
          {
            completedAt: {
              gte: dateFrom,
              lte: dateTo,
            },
          },
          {
            cancelledAt: {
              gte: dateFrom,
              lte: dateTo,
            },
          },
        ],
      },
      select: {
        id: true,
        createdAt: true,
        completedAt: true,
        cancelledAt: true,
        status: true,
        finalLabor: true,
        commissionAmount: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })
  }
}
