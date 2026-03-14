import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CatalogService } from './catalog.service'
import {
  CategoryDto,
  CityDto,
  PricingRuleDto,
  PublicServiceSearchQueryDto,
  PublicServiceSearchResponseDto,
  PublicPricingRuleQueryDto,
  SubServiceDto,
} from './dto/catalog.dto'

@ApiTags('Public Catalog')
@Controller('public')
export class PublicCatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('cities')
  @ApiOperation({ summary: 'List active public cities' })
  @ApiOkResponse({ type: CityDto, isArray: true })
  listCities() {
    return this.catalogService.listPublicCities()
  }

  @Get('cities/:citySlug')
  @ApiOperation({ summary: 'Get public city details by slug' })
  @ApiOkResponse({ type: CityDto })
  getCity(@Param('citySlug') citySlug: string) {
    return this.catalogService.getPublicCity(citySlug)
  }

  @Get('cities/:citySlug/categories')
  @ApiOperation({ summary: 'List active categories for a city' })
  @ApiOkResponse({ type: CategoryDto, isArray: true })
  listCategories(@Param('citySlug') citySlug: string) {
    return this.catalogService.listPublicCategories(citySlug)
  }

  @Get('cities/:citySlug/categories/:categorySlug/subservices')
  @ApiOperation({ summary: 'List active subservices in a category for a city' })
  @ApiOkResponse({ type: SubServiceDto, isArray: true })
  listSubServices(
    @Param('citySlug') citySlug: string,
    @Param('categorySlug') categorySlug: string,
  ) {
    return this.catalogService.listPublicSubServices(citySlug, categorySlug)
  }

  @Get('service-search')
  @ApiOperation({ summary: 'Search public categories and subservices for a city' })
  @ApiOkResponse({ type: PublicServiceSearchResponseDto })
  searchServices(@Query() query: PublicServiceSearchQueryDto) {
    return this.catalogService.searchPublicServices(query)
  }

  @Get('pricing-rules')
  @ApiOperation({ summary: 'Get pricing rule for a city and subservice' })
  @ApiOkResponse({ type: PricingRuleDto })
  getPricingRule(@Query() query: PublicPricingRuleQueryDto) {
    return this.catalogService.getPublicPricingRule(query)
  }
}
