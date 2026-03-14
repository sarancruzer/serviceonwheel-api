import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { BookingStatus, PaymentMode, PhotoKind, SettlementStatus } from '@prisma/client'
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator'

export class BookingListQueryDto {
  @ApiPropertyOptional({ enum: BookingStatus })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus

  @ApiPropertyOptional({ example: '2026-03-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string

  @ApiPropertyOptional({ example: '2026-03-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  dateTo?: string
}

export class AdminBookingListQueryDto extends BookingListQueryDto {
  @ApiPropertyOptional({ example: 'electrician' })
  @IsOptional()
  @IsString()
  categorySlug?: string

  @ApiPropertyOptional({ example: '613001' })
  @IsOptional()
  @IsString()
  pincode?: string

  @ApiPropertyOptional({ example: 'vendor-profile-id' })
  @IsOptional()
  @IsUUID()
  vendorId?: string

  @ApiPropertyOptional({ example: '6Z9bK3QaM2Lp' })
  @IsOptional()
  @IsString()
  search?: string
}

export class AssignBookingDto {
  @ApiProperty({ example: 'vendor-profile-id' })
  @IsUUID()
  vendorId: string
}

export class UpdateBookingStatusDto {
  @ApiProperty({ enum: BookingStatus, example: BookingStatus.IN_PROGRESS })
  @IsEnum(BookingStatus)
  status: BookingStatus
}

export class CompleteBookingDto {
  @ApiProperty({ example: '799.00' })
  @IsString()
  finalLabor: string

  @ApiPropertyOptional({ example: 'Replaced damaged wire and MCB.' })
  @IsOptional()
  @IsString()
  partsNote?: string

  @ApiProperty({ enum: PaymentMode, example: PaymentMode.UPI })
  @IsEnum(PaymentMode)
  paymentModeUsed: PaymentMode
}

export class CancelBookingDto {
  @ApiProperty({ example: 'Customer requested cancellation before technician dispatch.' })
  @IsString()
  reason: string
}

export class BookingCustomerDto {
  @ApiPropertyOptional({ example: 'customer-user-id', nullable: true })
  id: string | null

  @ApiProperty({ example: 'Saravanan Anandhan' })
  name: string

  @ApiPropertyOptional({ example: 'customer@example.com', nullable: true })
  email: string | null

  @ApiPropertyOptional({ example: '+919876543210', nullable: true })
  phone: string | null
}

export class BookingAddressDto {
  @ApiProperty({ example: 'address-id' })
  id: string

  @ApiProperty({ example: 'Thanjavur' })
  cityName: string

  @ApiProperty({ example: 'thanjavur' })
  citySlug: string

  @ApiPropertyOptional({ example: 'Home', nullable: true })
  label: string | null

  @ApiProperty({ example: '12, South Main Street' })
  line1: string

  @ApiPropertyOptional({ example: 'Near old bus stand', nullable: true })
  landmark: string | null

  @ApiProperty({ example: '613001' })
  pincode: string

  @ApiPropertyOptional({ example: '10.7869991', nullable: true })
  lat: string | null

  @ApiPropertyOptional({ example: '79.1378274', nullable: true })
  lng: string | null

  @ApiProperty({ example: true })
  isDefault: boolean
}

export class BookingAssignmentDto {
  @ApiProperty({ example: 'assignment-id' })
  id: string

  @ApiProperty({ example: 'vendor-profile-id' })
  vendorId: string

  @ApiProperty({ example: 'Demo Vendor' })
  vendorName: string

  @ApiPropertyOptional({ example: '+919900000020', nullable: true })
  vendorPhone: string | null

  @ApiProperty({ example: 'ASSIGNED' })
  assignmentStatus: string

  @ApiProperty({ example: '2026-03-13T10:30:00.000Z' })
  assignedAt: string

  @ApiPropertyOptional({ example: '2026-03-13T10:35:00.000Z', nullable: true })
  acceptedAt: string | null

  @ApiPropertyOptional({ example: '2026-03-13T11:35:00.000Z', nullable: true })
  completedAt: string | null
}

export class BookingPhotoDto {
  @ApiProperty({ example: 'photo-id' })
  id: string

  @ApiProperty({ example: 'bookings/6Z9bK3QaM2Lp/problem/abc123.jpg' })
  s3Key: string

  @ApiProperty({ enum: PhotoKind, example: PhotoKind.PROBLEM })
  kind: PhotoKind

  @ApiProperty({ example: '2026-03-13T10:30:00.000Z' })
  createdAt: string
}

export class BookingReviewDto {
  @ApiProperty({ example: 'review-id' })
  id: string

  @ApiProperty({ example: 5 })
  rating: number

  @ApiPropertyOptional({ example: 'Technician was punctual and resolved the issue quickly.' })
  comment: string | null

  @ApiProperty({ example: '2026-03-13T10:30:00.000Z' })
  createdAt: string
}

export class BookingListItemDto {
  @ApiProperty({ example: 'booking-id' })
  id: string

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

  @ApiProperty({ example: '2026-03-15T09:00:00.000Z' })
  scheduledDate: string

  @ApiProperty({ example: '09:00-12:00' })
  timeWindow: string

  @ApiProperty({ example: '149.00' })
  visitFee: string

  @ApiPropertyOptional({ example: '299.00', nullable: true })
  estimatedLabor: string | null

  @ApiPropertyOptional({ example: '799.00', nullable: true })
  finalLabor: string | null

  @ApiProperty({ enum: SettlementStatus, example: SettlementStatus.UNSETTLED })
  settlementStatus: SettlementStatus

  @ApiProperty({ example: 'Saravanan Anandhan' })
  customerName: string

  @ApiPropertyOptional({ example: '+919876543210', nullable: true })
  customerPhone: string | null

  @ApiPropertyOptional({ example: 'Demo Vendor', nullable: true })
  providerName: string | null

  @ApiProperty({ example: '2026-03-13T10:30:00.000Z' })
  createdAt: string
}

export class BookingDetailDto extends BookingListItemDto {
  @ApiProperty({ example: 20 })
  commissionRatePct: number

  @ApiPropertyOptional({ example: '159.80', nullable: true })
  commissionAmount: string | null

  @ApiPropertyOptional({ example: '639.20', nullable: true })
  payoutAmount: string | null

  @ApiPropertyOptional({ example: 'Replaced damaged wire and MCB.', nullable: true })
  partsNote: string | null

  @ApiPropertyOptional({ example: 'Frequent tripping in bedroom circuit', nullable: true })
  customerNote: string | null

  @ApiPropertyOptional({ enum: PaymentMode, nullable: true })
  paymentModeUsed: PaymentMode | null

  @ApiPropertyOptional({ example: '2026-11', nullable: true })
  settlementWeek: string | null

  @ApiPropertyOptional({ example: 'UPI123456789', nullable: true })
  settlementRef: string | null

  @ApiProperty({ type: BookingCustomerDto })
  customer: BookingCustomerDto

  @ApiProperty({ type: BookingAddressDto })
  address: BookingAddressDto

  @ApiProperty({ type: BookingAssignmentDto, isArray: true })
  assignments: BookingAssignmentDto[]

  @ApiProperty({ type: BookingPhotoDto, isArray: true })
  photos: BookingPhotoDto[]

  @ApiPropertyOptional({ type: BookingReviewDto, nullable: true })
  review: BookingReviewDto | null

  @ApiPropertyOptional({ example: '2026-03-15T11:00:00.000Z', nullable: true })
  completedAt: string | null

  @ApiPropertyOptional({ example: '2026-03-15T08:00:00.000Z', nullable: true })
  cancelledAt: string | null

  @ApiPropertyOptional({ example: 'Customer requested cancellation', nullable: true })
  cancelReason: string | null
}
