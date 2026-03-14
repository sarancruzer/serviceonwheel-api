import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { Role } from '@prisma/client'
import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator'

export class RegisterDto {
  @ApiProperty({ example: 'customer@example.com' })
  @IsEmail()
  email: string

  @ApiProperty({ example: 'StrongPass@123' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string

  @ApiProperty({ example: 'Saravanan Anandhan' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  @Matches(/^[+0-9][0-9\s-]{7,20}$/)
  phone?: string
}

export class LoginDto {
  @ApiProperty({ example: 'customer@example.com' })
  @IsEmail()
  email: string

  @ApiProperty({ example: 'StrongPass@123' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string
}

export class RefreshDto {
  @ApiProperty({ example: 'refresh-token-value' })
  @IsString()
  refreshToken: string
}

export class LogoutDto extends RefreshDto {}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'customer@example.com' })
  @IsEmail()
  email: string
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'reset-token-from-email' })
  @IsString()
  token: string

  @ApiProperty({ example: 'NewPass@1234' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword: string
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'CurrentPass@123' })
  @IsString()
  currentPassword: string

  @ApiProperty({ example: 'NewPass@1234' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword: string
}

export class UpdateProfileDto extends PartialType(RegisterDto) {
  @ApiPropertyOptional({ example: 'Saravanan Anandhan' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  @Matches(/^[+0-9][0-9\s-]{7,20}$/)
  phone?: string
}

export class VendorProfileSummaryDto {
  @ApiProperty({ example: '25c0c710-0047-4967-82de-d1d6be57b7df' })
  id: string

  @ApiProperty({ example: 'VERIFIED', nullable: true })
  kycStatus: string | null

  @ApiProperty({ example: true })
  isActive: boolean
}

export class MeResponseDto {
  @ApiProperty({ example: 'eb2fffc8-111a-4244-b6d2-16f73187ef8f' })
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

  @ApiPropertyOptional({ type: VendorProfileSummaryDto, nullable: true })
  vendorProfile: VendorProfileSummaryDto | null
}

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string

  @ApiProperty({ example: 'refresh-token-value' })
  refreshToken: string

  @ApiProperty({ example: 900 })
  expiresIn: number

  @ApiProperty({ enum: Role, isArray: true, example: [Role.CUSTOMER] })
  roles: Role[]

  @ApiProperty({ type: MeResponseDto })
  user: MeResponseDto
}

export class MessageResponseDto {
  @ApiProperty({ example: 'If the account exists, a reset link has been sent.' })
  message: string
}
