import { ApiProperty } from '@nestjs/swagger'

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status: string

  @ApiProperty({ example: 'serviceonwheel-api' })
  service: string

  @ApiProperty({ example: '2026-03-13T10:30:00.000Z' })
  timestamp: string
}

export class DbHealthResponseDto extends HealthResponseDto {
  @ApiProperty({ example: 'postgres' })
  database: string
}
