import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Role } from '@prisma/client'
import { Roles } from '../common/decorators/roles.decorator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { ReportSummaryQueryDto, ReportSummaryResponseDto } from './dto/reports.dto'
import { ReportsService } from './reports.service'

@ApiTags('Admin Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get daily and weekly booking/revenue summary' })
  @ApiOkResponse({ type: ReportSummaryResponseDto })
  getSummary(@Query() query: ReportSummaryQueryDto) {
    return this.reportsService.getSummary(query)
  }
}
