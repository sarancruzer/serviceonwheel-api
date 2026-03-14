import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { BookingStatus, PaymentMode, PhotoKind } from '@prisma/client'
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'

export class PublicAddressInputDto {
  @ApiProperty({ example: '12, South Main Street' })
  @IsString()
  line1: string

  @ApiPropertyOptional({ example: 'Near old bus stand' })
  @IsOptional()
  @IsString()
  landmark?: string

  @ApiProperty({ example: '613001' })
  @IsString()
  pincode: string

  @ApiPropertyOptional({ example: '10.7869991' })
  @IsOptional()
  @IsString()
  lat?: string

  @ApiPropertyOptional({ example: '79.1378274' })
  @IsOptional()
  @IsString()
  lng?: string

  @ApiPropertyOptional({ example: 'Home' })
  @IsOptional()
  @IsString()
  label?: string

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  isDefault?: boolean
}

export class CreatePublicBookingDto {
  @ApiPropertyOptional({ example: 'Saravanan Anandhan' })
  @IsOptional()
  @IsString()
  guestName?: string

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  guestPhone?: string

  @ApiProperty({ example: 'thanjavur' })
  @IsString()
  citySlug: string

  @ApiProperty({ example: 'electrician' })
  @IsString()
  categorySlug: string

  @ApiProperty({ example: 'wiring-repair' })
  @IsString()
  subServiceSlug: string

  @ApiProperty({ type: PublicAddressInputDto })
  @ValidateNested()
  @Type(() => PublicAddressInputDto)
  address: PublicAddressInputDto

  @ApiProperty({ example: '2026-03-15T09:00:00.000Z' })
  @IsDateString()
  scheduledDate: string

  @ApiProperty({ example: '09:00-12:00' })
  @IsString()
  timeWindow: string

  @ApiPropertyOptional({ example: 'Frequent tripping in bedroom circuit' })
  @IsOptional()
  @IsString()
  notes?: string
}

export class CreatePublicReviewDto {
  @ApiProperty({ example: '6Z9bK3QaM2Lp' })
  @IsString()
  bookingCode: string

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number

  @ApiPropertyOptional({ example: 'Technician was punctual and resolved the issue quickly.' })
  @IsOptional()
  @IsString()
  comment?: string
}

export class CreatePartnerLeadDto {
  @ApiProperty({ example: 'Muthu Service Works' })
  @IsString()
  name: string

  @ApiProperty({ example: '+919876543210' })
  @IsString()
  phone: string

  @ApiProperty({ example: ['electrician', 'plumber'], isArray: true })
  categoriesInterested: string[]

  @ApiProperty({ example: ['613001', '613005'], isArray: true })
  pincodes: string[]

  @ApiPropertyOptional({ example: '15 years experience in residential maintenance.' })
  @IsOptional()
  @IsString()
  message?: string
}

export class PublicUploadPresignDto {
  @ApiProperty({ example: '6Z9bK3QaM2Lp' })
  @IsString()
  bookingCode: string

  @ApiProperty({ enum: PhotoKind, example: PhotoKind.PROBLEM })
  @IsEnum(PhotoKind)
  kind: PhotoKind

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  contentType: string

  @ApiProperty({ example: 'jpg' })
  @IsString()
  fileExt: string
}

export class PublicUploadFinalizeDto {
  @ApiProperty({ example: '6Z9bK3QaM2Lp' })
  @IsString()
  bookingCode: string

  @ApiProperty({ enum: PhotoKind, example: PhotoKind.PROBLEM })
  @IsEnum(PhotoKind)
  kind: PhotoKind

  @ApiProperty({ example: 'bookings/6Z9bK3QaM2Lp/problem/abc123.jpg' })
  @IsString()
  s3Key: string
}

export class BookingTimelineItemDto {
  @ApiProperty({ example: 'NEW' })
  status: string

  @ApiProperty({ example: '2026-03-13T10:30:00.000Z' })
  at: string
}

export class PublicBookingStatusResponseDto {
  @ApiProperty({ example: '6Z9bK3QaM2Lp' })
  bookingCode: string

  @ApiProperty({ enum: BookingStatus, example: BookingStatus.ASSIGNED })
  status: BookingStatus

  @ApiProperty({ example: 'Thanjavur' })
  cityName: string

  @ApiProperty({ example: 'Electrician' })
  categoryName: string

  @ApiProperty({ example: 'Wiring Repair' })
  subServiceName: string

  @ApiProperty({ example: '98******10', nullable: true })
  maskedCustomerPhone: string | null

  @ApiProperty({ example: '12, South ...' })
  maskedAddress: string

  @ApiPropertyOptional({ example: 'Demo Vendor', nullable: true })
  providerName: string | null

  @ApiProperty({ example: '149.00' })
  visitFee: string

  @ApiPropertyOptional({ example: '299.00', nullable: true })
  estimatedLabor: string | null

  @ApiPropertyOptional({ example: '450.00', nullable: true })
  finalLabor: string | null

  @ApiPropertyOptional({ enum: PaymentMode, nullable: true })
  paymentModeUsed: PaymentMode | null

  @ApiProperty({ type: BookingTimelineItemDto, isArray: true })
  timeline: BookingTimelineItemDto[]
}

export class PublicBookingCreatedResponseDto {
  @ApiProperty({ example: '6Z9bK3QaM2Lp' })
  bookingCode: string

  @ApiProperty({ enum: BookingStatus, example: BookingStatus.NEW })
  status: BookingStatus

  @ApiProperty({ example: '149.00' })
  visitFee: string

  @ApiPropertyOptional({ example: '299.00', nullable: true })
  estimatedLabor: string | null

  @ApiProperty({ example: '2026-03-15T09:00:00.000Z' })
  scheduledDate: string

  @ApiProperty({ example: '09:00-12:00' })
  timeWindow: string
}

export class UploadPresignResponseDto {
  @ApiProperty({ example: 'https://bucket.s3.amazonaws.com/...' })
  uploadUrl: string

  @ApiProperty({ example: 'bookings/6Z9bK3QaM2Lp/problem/abc123.jpg' })
  s3Key: string

  @ApiProperty({ example: 900 })
  expiresIn: number

  @ApiProperty({ example: 5242880 })
  maxSizeBytes: number
}
