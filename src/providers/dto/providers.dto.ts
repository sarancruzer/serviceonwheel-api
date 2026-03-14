import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { KycStatus, Role } from '@prisma/client'
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator'

export class VendorServiceAreaDto {
  @ApiProperty({ example: '84e61e5a-5dc0-4e16-b120-c9903b8490f6' })
  id: string

  @ApiProperty({ example: '613001' })
  pincode: string

  @ApiPropertyOptional({ example: 'Old Bus Stand', nullable: true })
  areaName: string | null

  @ApiProperty({ example: 'Thanjavur' })
  cityName: string

  @ApiProperty({ example: 'thanjavur' })
  citySlug: string
}

export class VendorSkillDto {
  @ApiProperty({ example: '7e0e8bf2-17ca-4554-9391-55cf9cde5711' })
  id: string

  @ApiProperty({ example: true })
  isActive: boolean

  @ApiProperty({ example: 'Wiring Repair' })
  subServiceName: string

  @ApiProperty({ example: 'wiring-repair' })
  subServiceSlug: string

  @ApiProperty({ example: 'Electrician' })
  categoryName: string
}

export class VendorProfileDto {
  @ApiProperty({ example: '4ac74f10-ce5b-4514-b501-3a19c511b85d' })
  id: string

  @ApiProperty({ example: '2d18d990-5319-4a4d-814b-6a2c3a8f473e' })
  userId: string

  @ApiProperty({ example: 'vendor@example.com' })
  email: string

  @ApiProperty({ example: 'Demo Vendor' })
  name: string

  @ApiPropertyOptional({ example: '+919900000020', nullable: true })
  phone: string | null

  @ApiProperty({ enum: KycStatus, example: KycStatus.VERIFIED })
  kycStatus: KycStatus

  @ApiProperty({ example: true })
  isActive: boolean

  @ApiProperty({ enum: Role, isArray: true, example: [Role.VENDOR] })
  roles: Role[]

  @ApiProperty({ type: VendorServiceAreaDto, isArray: true })
  serviceAreas: VendorServiceAreaDto[]

  @ApiProperty({ type: VendorSkillDto, isArray: true })
  skills: VendorSkillDto[]
}

export class CreateVendorDto {
  @ApiPropertyOptional({ example: 'existing-user-id' })
  @IsOptional()
  @IsUUID()
  userId?: string

  @ApiPropertyOptional({ example: 'vendor@example.com' })
  @IsOptional()
  @IsString()
  email?: string

  @ApiPropertyOptional({ example: 'Vendor@12345' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password?: string

  @ApiPropertyOptional({ example: 'Demo Vendor' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ example: '+919900000020' })
  @IsOptional()
  @IsString()
  @Matches(/^[+0-9][0-9\s-]{7,20}$/)
  phone?: string

  @ApiPropertyOptional({ enum: KycStatus, example: KycStatus.PENDING })
  @IsOptional()
  @IsEnum(KycStatus)
  kycStatus?: KycStatus

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}

export class UpdateVendorDto extends PartialType(CreateVendorDto) {}

export class UpdateOwnVendorProfileDto {
  @ApiPropertyOptional({ example: 'Demo Vendor' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ example: '+919900000020' })
  @IsOptional()
  @IsString()
  @Matches(/^[+0-9][0-9\s-]{7,20}$/)
  phone?: string
}

export class AddVendorAreaDto {
  @ApiProperty({ example: 'b649674f-a5d0-4fd6-b4a5-4ff1b1ae7c5f' })
  @IsUUID()
  cityId: string

  @ApiProperty({ example: '613001' })
  @IsString()
  pincode: string

  @ApiPropertyOptional({ example: 'Old Bus Stand' })
  @IsOptional()
  @IsString()
  areaName?: string
}

export class AddVendorSkillDto {
  @ApiProperty({ example: '86d5324a-908e-42d6-837c-467f90e5880e' })
  @IsUUID()
  subServiceId: string

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
