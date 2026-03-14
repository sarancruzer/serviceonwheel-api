import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Role } from '@prisma/client'
import { CurrentCustomer } from '../common/decorators/current-customer.decorator'
import { Roles } from '../common/decorators/roles.decorator'
import type { AuthenticatedCustomerUser } from '../common/interfaces/request-context.interface'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { CustomersService } from './customers.service'
import { CustomerProfileDto } from './dto/customers.dto'

@ApiTags('Customer Profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CUSTOMER)
@Controller('customer/profile')
export class CustomerProfileController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'Get customer profile' })
  @ApiOkResponse({ type: CustomerProfileDto })
  getProfile(@CurrentCustomer() customer: AuthenticatedCustomerUser) {
    return this.customersService.getProfile(customer.sub)
  }
}
