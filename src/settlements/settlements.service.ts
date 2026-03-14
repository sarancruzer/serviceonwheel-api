import { Injectable } from '@nestjs/common'
import { SettlementStatus } from '@prisma/client'
import { AuditService } from '../audit/audit.service'
import type { AuthenticatedAdminUser } from '../common/interfaces/request-context.interface'
import { AuditActorType } from '../common/types/enums'
import { MarkSettledDto, SettlementSummaryQueryDto } from './dto/settlements.dto'
import { SettlementsRepository } from './settlements.repository'
import { buildSettlementCsv, buildSettlementSummary } from './settlements.utils'

@Injectable()
export class SettlementsService {
  constructor(
    private readonly settlementsRepository: SettlementsRepository,
    private readonly auditService: AuditService,
  ) {}

  async getSummary(query: SettlementSummaryQueryDto) {
    const bookings = await this.settlementsRepository.listSettlementBookings({
      week: query.week,
      status: query.status ?? SettlementStatus.UNSETTLED,
    })

    return buildSettlementSummary(bookings)
  }

  async markSettled(payload: MarkSettledDto, admin: AuthenticatedAdminUser) {
    const bookings = await this.settlementsRepository.listSettlementBookings({
      week: payload.week,
      status: SettlementStatus.UNSETTLED,
      vendorId: payload.vendorId,
    })

    const updatedCount = await this.settlementsRepository.markSettled(
      bookings.map((booking) => booking.id),
      payload.settlementRef.trim(),
      new Date(payload.settlementDate),
    )

    await this.auditService.log({
      actorType: AuditActorType.ADMIN,
      actorUserId: admin.sub,
      action: 'MARK_SETTLEMENT_BATCH_SETTLED',
      entityType: 'SettlementBatch',
      entityId: `${payload.week}:${payload.vendorId}`,
      after: {
        updatedCount,
        settlementRef: payload.settlementRef,
      },
    })

    return {
      updatedCount,
    }
  }

  async exportCsv(week: string) {
    const bookings = await this.settlementsRepository.listSettlementBookings({
      week,
    })

    return buildSettlementCsv(buildSettlementSummary(bookings))
  }
}
