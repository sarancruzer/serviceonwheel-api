import { Injectable } from '@nestjs/common'
import { AuditActorType, Prisma } from '@prisma/client'
import { RequestContextService } from '../common/services/request-context.service'
import { AuditRepository } from './audit.repository'
import { AuditQueryDto } from './dto/audit.dto'

@Injectable()
export class AuditService {
  constructor(
    private readonly auditRepository: AuditRepository,
    private readonly requestContext: RequestContextService,
  ) {}

  log(params: {
    actorType: AuditActorType
    actorUserId: string
    action: string
    entityType: string
    entityId: string
    before?: unknown
    after?: unknown
  }) {
    return this.auditRepository.create({
      actorType: params.actorType,
      actorUserId: params.actorUserId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      beforeJson: this.toJsonInput(params.before),
      afterJson: this.toJsonInput(params.after),
      requestId: this.requestContext.getRequestId() ?? 'unknown',
    })
  }

  list(query: AuditQueryDto) {
    return this.auditRepository.findMany({
      actorType: query.actorType,
      actorUserId: query.actorUserId,
      entityType: query.entityType,
      entityId: query.entityId,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
    })
  }

  private toJsonInput(value: unknown): Prisma.InputJsonValue | null {
    if (value === undefined || value === null) {
      return null
    }

    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
  }
}
