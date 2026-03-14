import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { BookingStatus, Role } from '@prisma/client'
import { Type } from 'class-transformer'
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator'
import { PublicAddressInputDto } from '../../bookings/dto/public-bookings.dto'

export class CustomerProfileDto {
  @ApiProperty({ example: 'user-id' })
  id: string

  @ApiProperty({ example: 'customer@example.com' })
  email: string

  @ApiProperty({ example: 'Saravanan Anandhan' })
  name: string

  @ApiPropertyOptional({ example: '+919876543210', nullable: true })
  phone: string | null

  @ApiProperty({ example: true })
  isActive: boolean

  @ApiProperty({ enum: Role, isArray: true, example: [Role.CUSTOMER] })
  roles: Role[]
}

export class AddressDto {
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

export class CreateAddressDto {
  @ApiProperty({ example: 'thanjavur' })
  @IsString()
  citySlug: string

  @ApiPropertyOptional({ example: 'Home' })
  @IsOptional()
  @IsString()
  label?: string

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

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  isDefault?: boolean
}

export class UpdateAddressDto extends PartialType(CreateAddressDto) {}

export class CustomerBookingQueryDto {
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

export class CreateCustomerBookingDto {
  @ApiProperty({ example: 'thanjavur' })
  @IsString()
  citySlug: string

  @ApiProperty({ example: 'electrician' })
  @IsString()
  categorySlug: string

  @ApiProperty({ example: 'wiring-repair' })
  @IsString()
  subServiceSlug: string

  @ApiPropertyOptional({ example: 'address-id' })
  @IsOptional()
  @IsUUID()
  addressId?: string

  @ApiPropertyOptional({ type: PublicAddressInputDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PublicAddressInputDto)
  address?: PublicAddressInputDto

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

export class CancelCustomerBookingDto {
  @ApiProperty({ example: 'Need to reschedule to next week.' })
  @IsString()
  reason: string
}
