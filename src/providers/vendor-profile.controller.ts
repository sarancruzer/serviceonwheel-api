import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Role } from '@prisma/client'
import { CurrentVendor } from '../common/decorators/current-vendor.decorator'
import { Roles } from '../common/decorators/roles.decorator'
import type { AuthenticatedVendorUser } from '../common/interfaces/request-context.interface'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { ProvidersService } from './providers.service'
import { UpdateOwnVendorProfileDto, VendorProfileDto } from './dto/providers.dto'

@ApiTags('Vendor App')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.VENDOR)
@Controller('vendor')
export class VendorProfileController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get vendor profile, skills and service areas' })
  @ApiOkResponse({ type: VendorProfileDto })
  getProfile(@CurrentVendor() vendor: AuthenticatedVendorUser) {
    return this.providersService.getVendorProfile(vendor.sub)
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update vendor-owned profile fields' })
  @ApiOkResponse({ type: VendorProfileDto })
  updateProfile(
    @CurrentVendor() vendor: AuthenticatedVendorUser,
    @Body() payload: UpdateOwnVendorProfileDto,
  ) {
    return this.providersService.updateVendorProfile(vendor.sub, payload)
  }

  @Get('jobs')
  @ApiOperation({ summary: 'Phase-2 placeholder for vendor job APIs' })
  @ApiOkResponse({
    schema: {
      example: {
        items: [],
        message: 'Vendor job APIs are reserved for Phase-2.',
      },
    },
  })
  listJobsPlaceholder() {
    return this.providersService.listJobsPlaceholder()
  }
}
