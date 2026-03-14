import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsDateString, IsOptional } from 'class-validator'

export class ReportSummaryQueryDto {
  @ApiPropertyOptional({ example: '2026-03-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string

  @ApiPropertyOptional({ example: '2026-03-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  dateTo?: string
}

export class ReportPointDto {
  @ApiProperty({ example: '2026-03-13' })
  period: string

  @ApiProperty({ example: 12 })
  newBookings: number

  @ApiProperty({ example: 8 })
  completedBookings: number

  @ApiProperty({ example: 2 })
  cancelledBookings: number

  @ApiProperty({ example: '6192.00' })
  revenue: string

  @ApiProperty({ example: '1238.40' })
  commissions: string
}

export class ReportSummaryResponseDto {
  @ApiProperty({ example: '2026-03-01T00:00:00.000Z' })
  dateFrom: string

  @ApiProperty({ example: '2026-03-31T23:59:59.000Z' })
  dateTo: string

  @ApiProperty({
    example: {
      bookingsCreated: 24,
      bookingsCompleted: 18,
      bookingsCancelled: 4,
      revenue: '15240.00',
      commissions: '3048.00',
    },
  })
  totals: {
    bookingsCreated: number
    bookingsCompleted: number
    bookingsCancelled: number
    revenue: string
    commissions: string
  }

  @ApiProperty({ type: ReportPointDto, isArray: true })
  daily: ReportPointDto[]

  @ApiProperty({ type: ReportPointDto, isArray: true })
  weekly: ReportPointDto[]
}
