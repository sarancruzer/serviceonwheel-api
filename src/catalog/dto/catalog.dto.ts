import { Transform } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { FaqScopeType, PriceType } from '@prisma/client'
import {
  IsBoolean,
  IsInt,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Matches,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator'

export class CityDto {
  @ApiProperty({ example: 'b649674f-a5d0-4fd6-b4a5-4ff1b1ae7c5f' })
  id: string

  @ApiProperty({ example: 'Thanjavur' })
  name: string

  @ApiProperty({ example: 'thanjavur' })
  slug: string

  @ApiProperty({ example: true })
  isActive: boolean
}

export class CategoryDto {
  @ApiProperty({ example: '74f25bc9-4dd0-46fc-8c55-276f9c2d5182' })
  id: string

  @ApiProperty({ example: 'Electrician' })
  name: string

  @ApiProperty({ example: 'electrician' })
  slug: string

  @ApiPropertyOptional({ example: 'catalog/electrician.svg', nullable: true })
  iconKey: string | null

  @ApiProperty({ example: true })
  isActive: boolean
}

export class SubCategoryDto {
  @ApiProperty({ example: '58e2c60d-35d7-42d5-af74-4efd04a2f649' })
  id: string

  @ApiProperty({ example: '74f25bc9-4dd0-46fc-8c55-276f9c2d5182' })
  categoryId: string

  @ApiProperty({ example: 'Annual maintenance contract' })
  name: string

  @ApiProperty({ example: 'annual-maintenance-contract' })
  slug: string

  @ApiPropertyOptional({
    example: 'Routine servicing and upkeep packages for air conditioners.',
    nullable: true,
  })
  description: string | null

  @ApiProperty({ example: 0 })
  sortOrder: number

  @ApiProperty({ example: true })
  isActive: boolean
}

export class ServiceDto {
  @ApiProperty({ example: '0f8d1c05-3868-4699-bb37-f7e70a37ad76' })
  id: string

  @ApiProperty({ example: '58e2c60d-35d7-42d5-af74-4efd04a2f649' })
  subCategoryId: string

  @ApiProperty({ example: 'Split AC' })
  name: string

  @ApiProperty({ example: 'split-ac' })
  slug: string

  @ApiPropertyOptional({
    example: 'Window AC 1600 Add to Cart',
    nullable: true,
  })
  description: string | null

  @ApiPropertyOptional({ example: '1600', nullable: true })
  priceText: string | null

  @ApiPropertyOptional({ example: 'fixed', nullable: true })
  priceType: string | null

  @ApiPropertyOptional({ example: '1600.00', nullable: true })
  priceValue: string | null

  @ApiProperty({ example: 0 })
  sortOrder: number

  @ApiProperty({ example: true })
  isActive: boolean
}

export class SubServiceDto {
  @ApiProperty({ example: '86d5324a-908e-42d6-837c-467f90e5880e' })
  id: string

  @ApiProperty({ example: '74f25bc9-4dd0-46fc-8c55-276f9c2d5182' })
  categoryId: string

  @ApiProperty({ example: 'Wiring Repair' })
  name: string

  @ApiProperty({ example: 'wiring-repair' })
  slug: string

  @ApiProperty({ example: true })
  isActive: boolean

  @ApiPropertyOptional({
    example: 'Wiring Repair in Thanjavur | Electrician',
    nullable: true,
  })
  seoTitle: string | null

  @ApiPropertyOptional({
    example: 'Book wiring repair experts in Thanjavur.',
    nullable: true,
  })
  seoDescription: string | null
}

export class PricingRuleDto {
  @ApiProperty({ example: '785c24d7-ff77-4b65-bfa4-6e5d8c612d05' })
  id: string

  @ApiProperty({ example: 'b649674f-a5d0-4fd6-b4a5-4ff1b1ae7c5f' })
  cityId: string

  @ApiProperty({ example: '86d5324a-908e-42d6-837c-467f90e5880e' })
  subServiceId: string

  @ApiProperty({ example: '149.00' })
  visitFee: string

  @ApiProperty({ enum: PriceType, example: PriceType.FIXED })
  priceType: PriceType

  @ApiPropertyOptional({ example: '299.00', nullable: true })
  baseLaborPrice: string | null

  @ApiPropertyOptional({
    example: 'Final price may vary after on-site inspection.',
    nullable: true,
  })
  notes: string | null

  @ApiProperty({ example: true })
  isActive: boolean
}

export class FaqDto {
  @ApiProperty({ example: '4517216d-a31d-4914-9e64-b14ba36314ee' })
  id: string

  @ApiProperty({ enum: FaqScopeType, example: FaqScopeType.CITY })
  scopeType: FaqScopeType

  @ApiProperty({ example: 'b649674f-a5d0-4fd6-b4a5-4ff1b1ae7c5f' })
  scopeId: string

  @ApiProperty({ example: 'Which areas of Thanjavur are currently covered?' })
  question: string

  @ApiProperty({ example: 'Phase-1 covers Thanjavur city and selected nearby pincodes.' })
  answer: string

  @ApiProperty({ example: 1 })
  sortOrder: number

  @ApiProperty({ example: true })
  isActive: boolean
}

export class CreateCityDto {
  @ApiProperty({ example: 'Thanjavur' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string

  @ApiProperty({ example: 'thanjavur' })
  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  slug: string

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}

export class UpdateCityDto extends PartialType(CreateCityDto) {}

export class CreateCategoryDto {
  @ApiProperty({ example: 'Electrician' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string

  @ApiProperty({ example: 'electrician' })
  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  slug: string

  @ApiPropertyOptional({ example: 'catalog/electrician.svg' })
  @IsOptional()
  @IsString()
  iconKey?: string

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

export class CreateSubServiceDto {
  @ApiProperty({ example: '74f25bc9-4dd0-46fc-8c55-276f9c2d5182' })
  @IsUUID()
  categoryId: string

  @ApiProperty({ example: 'Wiring Repair' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string

  @ApiProperty({ example: 'wiring-repair' })
  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  slug: string

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @ApiPropertyOptional({
    example: 'Wiring Repair in Thanjavur | Electrician',
  })
  @IsOptional()
  @IsString()
  seoTitle?: string

  @ApiPropertyOptional({
    example: 'Book wiring repair experts in Thanjavur.',
  })
  @IsOptional()
  @IsString()
  seoDescription?: string
}

export class UpdateSubServiceDto extends PartialType(CreateSubServiceDto) {}

export class CreatePricingRuleDto {
  @ApiProperty({ example: 'b649674f-a5d0-4fd6-b4a5-4ff1b1ae7c5f' })
  @IsUUID()
  cityId: string

  @ApiProperty({ example: '86d5324a-908e-42d6-837c-467f90e5880e' })
  @IsUUID()
  subServiceId: string

  @ApiProperty({ example: '149.00' })
  @IsString()
  visitFee: string

  @ApiProperty({ enum: PriceType, example: PriceType.FIXED })
  @IsEnum(PriceType)
  priceType: PriceType

  @ApiPropertyOptional({ example: '299.00' })
  @IsOptional()
  @IsString()
  baseLaborPrice?: string

  @ApiPropertyOptional({ example: 'Final price may vary after inspection.' })
  @IsOptional()
  @IsString()
  notes?: string

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}

export class UpdatePricingRuleDto extends PartialType(CreatePricingRuleDto) {}

export class CreateFaqDto {
  @ApiProperty({ enum: FaqScopeType, example: FaqScopeType.CATEGORY })
  @IsEnum(FaqScopeType)
  scopeType: FaqScopeType

  @ApiProperty({ example: '74f25bc9-4dd0-46fc-8c55-276f9c2d5182' })
  @IsString()
  @IsNotEmpty()
  scopeId: string

  @ApiProperty({ example: 'How is electrician pricing determined?' })
  @IsString()
  question: string

  @ApiProperty({ example: 'Visit fee is fixed. Labor may be fixed or inspection based.' })
  @IsString()
  answer: string

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  sortOrder?: number

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}

export class UpdateFaqDto extends PartialType(CreateFaqDto) {}

export class PublicPricingRuleQueryDto {
  @ApiProperty({ example: 'thanjavur' })
  @IsString()
  citySlug: string

  @ApiProperty({ example: 'wiring-repair' })
  @IsString()
  subServiceSlug: string
}

export enum PublicCatalogSearchType {
  ALL = 'all',
  CATEGORY = 'category',
  SUBSERVICE = 'subservice',
}

export enum PublicCatalogSearchResultType {
  CATEGORY = 'category',
  SUBSERVICE = 'subservice',
}

export class PublicServiceSearchQueryDto {
  @ApiProperty({ example: 'thanjavur' })
  @IsString()
  citySlug: string

  @ApiPropertyOptional({ example: 'repair' })
  @IsOptional()
  @IsString()
  q?: string

  @ApiPropertyOptional({
    enum: PublicCatalogSearchType,
    example: PublicCatalogSearchType.ALL,
  })
  @IsOptional()
  @IsEnum(PublicCatalogSearchType)
  type?: PublicCatalogSearchType

  @ApiPropertyOptional({ example: 6, minimum: 1, maximum: 20 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number
}

export class PublicServiceSearchResultDto {
  @ApiProperty({ example: 'Electrician' })
  categoryName: string

  @ApiProperty({ example: 'electrician' })
  categorySlug: string

  @ApiProperty({ example: 'thanjavur' })
  citySlug: string

  @ApiProperty({ example: '/services/electrician?city=thanjavur' })
  href: string

  @ApiProperty({ example: 'subservice-86d5324a-908e-42d6-837c-467f90e5880e' })
  id: string

  @ApiPropertyOptional({ example: 'wiring-repair', nullable: true })
  serviceSlug?: string

  @ApiProperty({ example: 'Book wiring repair experts in Thanjavur.' })
  subtitle: string

  @ApiProperty({ example: 'Wiring Repair' })
  title: string

  @ApiProperty({
    enum: PublicCatalogSearchResultType,
    example: PublicCatalogSearchResultType.SUBSERVICE,
  })
  type: PublicCatalogSearchResultType
}

export class PublicServiceSearchResponseDto {
  @ApiProperty({ example: 'thanjavur' })
  citySlug: string

  @ApiProperty({ type: PublicServiceSearchResultDto, isArray: true })
  items: PublicServiceSearchResultDto[]

  @ApiProperty({ example: 'repair' })
  query: string

  @ApiProperty({ example: 6 })
  total: number
}
