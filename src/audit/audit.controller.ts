import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Role } from '@prisma/client'
import { Roles } from '../common/decorators/roles.decorator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { AuditService } from './audit.service'
import { AuditLogResponseDto, AuditQueryDto } from './dto/audit.dto'

@ApiTags('Admin Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Query audit logs' })
  @ApiOkResponse({ type: AuditLogResponseDto, isArray: true })
  list(@Query() query: AuditQueryDto) {
    return this.auditService.list(query)
  }
}
