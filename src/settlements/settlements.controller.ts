import { Body, Controller, Get, Header, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Role } from '@prisma/client'
import { CurrentAdmin } from '../common/decorators/current-admin.decorator'
import { Roles } from '../common/decorators/roles.decorator'
import type { AuthenticatedAdminUser } from '../common/interfaces/request-context.interface'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import {
  MarkSettledDto,
  SettlementBatchResultDto,
  SettlementSummaryQueryDto,
  SettlementVendorSummaryDto,
} from './dto/settlements.dto'
import { SettlementsService } from './settlements.service'

@ApiTags('Admin Settlements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/settlements')
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get settlement summary grouped by vendor' })
  @ApiOkResponse({ type: SettlementVendorSummaryDto, isArray: true })
  getSummary(@Query() query: SettlementSummaryQueryDto) {
    return this.settlementsService.getSummary(query)
  }

  @Post('mark-settled')
  @ApiOperation({ summary: 'Mark vendor settlement batch as settled' })
  @ApiOkResponse({ type: SettlementBatchResultDto })
  markSettled(@Body() payload: MarkSettledDto, @CurrentAdmin() admin: AuthenticatedAdminUser) {
    return this.settlementsService.markSettled(payload, admin)
  }

  @Get('export.csv')
  @Header('Content-Type', 'text/csv')
  @ApiOperation({ summary: 'Export settlement CSV for a given week' })
  exportCsv(@Query('week') week: string) {
    return this.settlementsService.exportCsv(week)
  }
}
