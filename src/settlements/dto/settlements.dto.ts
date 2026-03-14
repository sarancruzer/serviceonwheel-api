import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { SettlementStatus } from '@prisma/client'
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator'

export class SettlementSummaryQueryDto {
  @ApiProperty({ example: '2026-11' })
  @IsString()
  week: string

  @ApiPropertyOptional({ enum: SettlementStatus, example: SettlementStatus.UNSETTLED })
  @IsOptional()
  @IsEnum(SettlementStatus)
  status?: SettlementStatus
}

export class MarkSettledDto {
  @ApiProperty({ example: '2026-11' })
  @IsString()
  week: string

  @ApiProperty({ example: 'vendor-profile-id' })
  @IsUUID()
  vendorId: string

  @ApiProperty({ example: 'UPI123456789' })
  @IsString()
  settlementRef: string

  @ApiProperty({ example: '2026-03-15T18:00:00.000Z' })
  @IsDateString()
  settlementDate: string
}

export class SettlementBookingLineDto {
  @ApiProperty({ example: 'booking-id' })
  id: string

  @ApiProperty({ example: '6Z9bK3QaM2Lp' })
  bookingCode: string

  @ApiProperty({ example: 'Saravanan Anandhan' })
  customerName: string

  @ApiProperty({ example: '799.00' })
  finalLabor: string

  @ApiProperty({ example: '159.80' })
  commissionAmount: string

  @ApiProperty({ example: '639.20' })
  payoutAmount: string

  @ApiPropertyOptional({ example: '2026-03-15T11:00:00.000Z', nullable: true })
  completedAt: string | null
}

export class SettlementVendorSummaryDto {
  @ApiProperty({ example: 'vendor-profile-id' })
  vendorId: string

  @ApiProperty({ example: 'Demo Vendor' })
  vendorName: string

  @ApiPropertyOptional({ example: '+919900000020', nullable: true })
  vendorPhone: string | null

  @ApiProperty({ example: 4 })
  bookingCount: number

  @ApiProperty({ example: '3196.00' })
  finalLaborTotal: string

  @ApiProperty({ example: '639.20' })
  commissionTotal: string

  @ApiProperty({ example: '2556.80' })
  payoutTotal: string

  @ApiProperty({ type: SettlementBookingLineDto, isArray: true })
  bookings: SettlementBookingLineDto[]
}

export class SettlementBatchResultDto {
  @ApiProperty({ example: 4 })
  updatedCount: number
}
