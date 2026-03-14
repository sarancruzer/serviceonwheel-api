import { Injectable } from '@nestjs/common'
import { AuditActorType, Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    actorType: AuditActorType
    actorUserId: string
    action: string
    entityType: string
    entityId: string
    beforeJson?: Prisma.InputJsonValue | null
    afterJson?: Prisma.InputJsonValue | null
    requestId: string
  }) {
    return this.prisma.auditLog.create({
      data: {
        ...data,
        beforeJson: data.beforeJson ?? Prisma.DbNull,
        afterJson: data.afterJson ?? Prisma.DbNull,
      },
    })
  }

  findMany(filters: {
    actorType?: AuditActorType
    actorUserId?: string
    entityType?: string
    entityId?: string
    dateFrom?: Date
    dateTo?: Date
  }) {
    return this.prisma.auditLog.findMany({
      where: {
        actorType: filters.actorType,
        actorUserId: filters.actorUserId,
        entityType: filters.entityType,
        entityId: filters.entityId,
        createdAt:
          filters.dateFrom || filters.dateTo
            ? {
                gte: filters.dateFrom,
                lte: filters.dateTo,
              }
            : undefined,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        actorUser: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })
  }
}
