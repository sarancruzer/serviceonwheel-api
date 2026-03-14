import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Role } from '@prisma/client'
import { CurrentAdmin } from '../common/decorators/current-admin.decorator'
import { Roles } from '../common/decorators/roles.decorator'
import type { AuthenticatedAdminUser } from '../common/interfaces/request-context.interface'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { CatalogService } from './catalog.service'
import {
  CategoryDto,
  CityDto,
  CreateCategoryDto,
  CreateCityDto,
  CreateFaqDto,
  CreatePricingRuleDto,
  CreateSubServiceDto,
  FaqDto,
  PricingRuleDto,
  SubServiceDto,
  UpdateCategoryDto,
  UpdateCityDto,
  UpdateFaqDto,
  UpdatePricingRuleDto,
  UpdateSubServiceDto,
} from './dto/catalog.dto'

@ApiTags('Admin Catalog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminCatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('cities')
  @ApiOperation({ summary: 'List cities' })
  @ApiOkResponse({ type: CityDto, isArray: true })
  listCities() {
    return this.catalogService.listCities()
  }

  @Post('cities')
  @ApiOperation({ summary: 'Create city' })
  @ApiOkResponse({ type: CityDto })
  createCity(@Body() payload: CreateCityDto, @CurrentAdmin() admin: AuthenticatedAdminUser) {
    return this.catalogService.createCity(payload, admin.sub)
  }

  @Get('cities/:id')
  @ApiOkResponse({ type: CityDto })
  getCity(@Param('id') id: string) {
    return this.catalogService.getCity(id)
  }

  @Put('cities/:id')
  @ApiOkResponse({ type: CityDto })
  updateCity(
    @Param('id') id: string,
    @Body() payload: UpdateCityDto,
    @CurrentAdmin() admin: AuthenticatedAdminUser,
  ) {
    return this.catalogService.updateCity(id, payload, admin.sub)
  }

  @Delete('cities/:id')
  @ApiOkResponse({ type: CityDto })
  deleteCity(@Param('id') id: string, @CurrentAdmin() admin: AuthenticatedAdminUser) {
    return this.catalogService.deleteCity(id, admin.sub)
  }

  @Get('categories')
  @ApiOkResponse({ type: CategoryDto, isArray: true })
  listCategories() {
    return this.catalogService.listCategories()
  }

  @Post('categories')
  @ApiOkResponse({ type: CategoryDto })
  createCategory(
    @Body() payload: CreateCategoryDto,
    @CurrentAdmin() admin: AuthenticatedAdminUser,
  ) {
    return this.catalogService.createCategory(payload, admin.sub)
  }

  @Get('categories/:id')
  @ApiOkResponse({ type: CategoryDto })
  getCategory(@Param('id') id: string) {
    return this.catalogService.getCategory(id)
  }

  @Put('categories/:id')
  @ApiOkResponse({ type: CategoryDto })
  updateCategory(
    @Param('id') id: string,
    @Body() payload: UpdateCategoryDto,
    @CurrentAdmin() admin: AuthenticatedAdminUser,
  ) {
    return this.catalogService.updateCategory(id, payload, admin.sub)
  }

  @Delete('categories/:id')
  @ApiOkResponse({ type: CategoryDto })
  deleteCategory(@Param('id') id: string, @CurrentAdmin() admin: AuthenticatedAdminUser) {
    return this.catalogService.deleteCategory(id, admin.sub)
  }

  @Get('subservices')
  @ApiOkResponse({ type: SubServiceDto, isArray: true })
  listSubServices() {
    return this.catalogService.listSubServices()
  }

  @Post('subservices')
  @ApiOkResponse({ type: SubServiceDto })
  createSubService(
    @Body() payload: CreateSubServiceDto,
    @CurrentAdmin() admin: AuthenticatedAdminUser,
  ) {
    return this.catalogService.createSubService(payload, admin.sub)
  }

  @Get('subservices/:id')
  @ApiOkResponse({ type: SubServiceDto })
  getSubService(@Param('id') id: string) {
    return this.catalogService.getSubService(id)
  }

  @Put('subservices/:id')
  @ApiOkResponse({ type: SubServiceDto })
  updateSubService(
    @Param('id') id: string,
    @Body() payload: UpdateSubServiceDto,
    @CurrentAdmin() admin: AuthenticatedAdminUser,
  ) {
    return this.catalogService.updateSubService(id, payload, admin.sub)
  }

  @Delete('subservices/:id')
  @ApiOkResponse({ type: SubServiceDto })
  deleteSubService(@Param('id') id: string, @CurrentAdmin() admin: AuthenticatedAdminUser) {
    return this.catalogService.deleteSubService(id, admin.sub)
  }

  @Get('pricing-rules')
  @ApiOkResponse({ type: PricingRuleDto, isArray: true })
  listPricingRules() {
    return this.catalogService.listPricingRules()
  }

  @Post('pricing-rules')
  @ApiOkResponse({ type: PricingRuleDto })
  createPricingRule(
    @Body() payload: CreatePricingRuleDto,
    @CurrentAdmin() admin: AuthenticatedAdminUser,
  ) {
    return this.catalogService.createPricingRule(payload, admin.sub)
  }

  @Get('pricing-rules/:id')
  @ApiOkResponse({ type: PricingRuleDto })
  getPricingRule(@Param('id') id: string) {
    return this.catalogService.getPricingRule(id)
  }

  @Put('pricing-rules/:id')
  @ApiOkResponse({ type: PricingRuleDto })
  updatePricingRule(
    @Param('id') id: string,
    @Body() payload: UpdatePricingRuleDto,
    @CurrentAdmin() admin: AuthenticatedAdminUser,
  ) {
    return this.catalogService.updatePricingRule(id, payload, admin.sub)
  }

  @Delete('pricing-rules/:id')
  @ApiOkResponse({ type: PricingRuleDto })
  deletePricingRule(@Param('id') id: string, @CurrentAdmin() admin: AuthenticatedAdminUser) {
    return this.catalogService.deletePricingRule(id, admin.sub)
  }

  @Get('faqs')
  @ApiOkResponse({ type: FaqDto, isArray: true })
  listFaqs() {
    return this.catalogService.listFaqs()
  }

  @Post('faqs')
  @ApiOkResponse({ type: FaqDto })
  createFaq(@Body() payload: CreateFaqDto, @CurrentAdmin() admin: AuthenticatedAdminUser) {
    return this.catalogService.createFaq(payload, admin.sub)
  }

  @Get('faqs/:id')
  @ApiOkResponse({ type: FaqDto })
  getFaq(@Param('id') id: string) {
    return this.catalogService.getFaq(id)
  }

  @Put('faqs/:id')
  @ApiOkResponse({ type: FaqDto })
  updateFaq(
    @Param('id') id: string,
    @Body() payload: UpdateFaqDto,
    @CurrentAdmin() admin: AuthenticatedAdminUser,
  ) {
    return this.catalogService.updateFaq(id, payload, admin.sub)
  }

  @Delete('faqs/:id')
  @ApiOkResponse({ type: FaqDto })
  deleteFaq(@Param('id') id: string, @CurrentAdmin() admin: AuthenticatedAdminUser) {
    return this.catalogService.deleteFaq(id, admin.sub)
  }
}
