import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Role } from '@prisma/client'
import { CurrentAdmin } from '../common/decorators/current-admin.decorator'
import { Roles } from '../common/decorators/roles.decorator'
import type { AuthenticatedAdminUser } from '../common/interfaces/request-context.interface'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { ProvidersService } from './providers.service'
import {
  AddVendorAreaDto,
  AddVendorSkillDto,
  CreateVendorDto,
  UpdateVendorDto,
  VendorProfileDto,
} from './dto/providers.dto'

@ApiTags('Admin Vendors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/vendors')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get()
  @ApiOperation({ summary: 'List vendors' })
  @ApiOkResponse({ type: VendorProfileDto, isArray: true })
  listVendors() {
    return this.providersService.listVendors()
  }

  @Post()
  @ApiOperation({ summary: 'Create or link a vendor profile' })
  @ApiOkResponse({ type: VendorProfileDto })
  createVendor(@Body() payload: CreateVendorDto, @CurrentAdmin() admin: AuthenticatedAdminUser) {
    return this.providersService.createVendor(payload, admin)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vendor profile by id' })
  @ApiOkResponse({ type: VendorProfileDto })
  getVendor(@Param('id') id: string) {
    return this.providersService.getVendor(id)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update vendor profile and linked user fields' })
  @ApiOkResponse({ type: VendorProfileDto })
  updateVendor(
    @Param('id') id: string,
    @Body() payload: UpdateVendorDto,
    @CurrentAdmin() admin: AuthenticatedAdminUser,
  ) {
    return this.providersService.updateVendor(id, payload, admin)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate vendor profile' })
  @ApiOkResponse({ type: VendorProfileDto })
  deleteVendor(@Param('id') id: string, @CurrentAdmin() admin: AuthenticatedAdminUser) {
    return this.providersService.deleteVendor(id, admin)
  }

  @Post(':id/areas')
  @ApiOperation({ summary: 'Add vendor service area' })
  @ApiOkResponse({
    schema: { example: { id: 'area-id', pincode: '613001', areaName: 'Old Bus Stand' } },
  })
  addArea(
    @Param('id') id: string,
    @Body() payload: AddVendorAreaDto,
    @CurrentAdmin() admin: AuthenticatedAdminUser,
  ) {
    return this.providersService.addVendorArea(id, payload, admin)
  }

  @Post(':id/skills')
  @ApiOperation({ summary: 'Add vendor skill' })
  @ApiOkResponse({ schema: { example: { id: 'skill-id', isActive: true } } })
  addSkill(
    @Param('id') id: string,
    @Body() payload: AddVendorSkillDto,
    @CurrentAdmin() admin: AuthenticatedAdminUser,
  ) {
    return this.providersService.addVendorSkill(id, payload, admin)
  }
}
