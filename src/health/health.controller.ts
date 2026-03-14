import { Controller, Get } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { DbHealthResponseDto, HealthResponseDto } from './health.dto'
import { HealthService } from './health.service'

@ApiTags('System')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Basic process health' })
  @ApiOkResponse({ type: HealthResponseDto })
  getHealth() {
    return this.healthService.getHealth()
  }

  @Get('db')
  @ApiOperation({ summary: 'Database connectivity health' })
  @ApiOkResponse({ type: DbHealthResponseDto })
  getDatabaseHealth() {
    return this.healthService.getDatabaseHealth()
  }
}
