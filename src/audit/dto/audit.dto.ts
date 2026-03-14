import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { AuditActorType } from '@prisma/client'
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator'

export class AuditQueryDto {
  @ApiPropertyOptional({ enum: AuditActorType })
  @IsOptional()
  @IsEnum(AuditActorType)
  actorType?: AuditActorType

  @ApiPropertyOptional({ example: 'a38718a3-26a9-40f5-9bf6-ab4f6780e628' })
  @IsOptional()
  @IsUUID()
  actorUserId?: string

  @ApiPropertyOptional({ example: 'Booking' })
  @IsOptional()
  @IsString()
  entityType?: string

  @ApiPropertyOptional({ example: 'booking-id' })
  @IsOptional()
  @IsString()
  entityId?: string

  @ApiPropertyOptional({ example: '2026-03-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string

  @ApiPropertyOptional({ example: '2026-03-13T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  dateTo?: string
}

export class AuditLogResponseDto {
  @ApiProperty({ example: '1c2d8bd6-0b44-4a52-b8da-8efdc7256f00' })
  id: string

  @ApiProperty({ enum: AuditActorType, example: AuditActorType.ADMIN })
  actorType: AuditActorType

  @ApiProperty({ example: 'CONFIRM_BOOKING' })
  action: string

  @ApiProperty({ example: 'Booking' })
  entityType: string

  @ApiProperty({ example: 'booking-id' })
  entityId: string

  @ApiPropertyOptional({ example: { status: 'NEW' }, nullable: true })
  beforeJson: unknown

  @ApiPropertyOptional({ example: { status: 'CONFIRMED' }, nullable: true })
  afterJson: unknown

  @ApiProperty({ example: 'c46bfd8f-2ca8-4db5-94a3-406502eb7af6' })
  requestId: string

  @ApiProperty({ example: '2026-03-13T10:30:00.000Z' })
  createdAt: string
}
