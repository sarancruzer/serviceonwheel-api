import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Role } from '@prisma/client'
import { CurrentCustomer } from '../common/decorators/current-customer.decorator'
import { Roles } from '../common/decorators/roles.decorator'
import type { AuthenticatedCustomerUser } from '../common/interfaces/request-context.interface'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { CustomersService } from './customers.service'
import { AddressDto, CreateAddressDto, UpdateAddressDto } from './dto/customers.dto'

@ApiTags('Customer Addresses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CUSTOMER)
@Controller('customer/addresses')
export class CustomerAddressesController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'List customer addresses' })
  @ApiOkResponse({ type: AddressDto, isArray: true })
  list(@CurrentCustomer() customer: AuthenticatedCustomerUser) {
    return this.customersService.listAddresses(customer.sub)
  }

  @Post()
  @ApiOperation({ summary: 'Create customer address' })
  @ApiOkResponse({ type: AddressDto })
  create(
    @CurrentCustomer() customer: AuthenticatedCustomerUser,
    @Body() payload: CreateAddressDto,
  ) {
    return this.customersService.createAddress(customer.sub, payload)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update customer address' })
  @ApiOkResponse({ type: AddressDto })
  update(
    @CurrentCustomer() customer: AuthenticatedCustomerUser,
    @Param('id') id: string,
    @Body() payload: UpdateAddressDto,
  ) {
    return this.customersService.updateAddress(customer.sub, id, payload)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete customer address' })
  @ApiOkResponse({
    schema: {
      example: {
        message: 'Address deleted successfully.',
      },
    },
  })
  delete(@CurrentCustomer() customer: AuthenticatedCustomerUser, @Param('id') id: string) {
    return this.customersService.deleteAddress(customer.sub, id)
  }

  @Post(':id/set-default')
  @ApiOperation({ summary: 'Set default customer address' })
  @ApiOkResponse({ type: AddressDto })
  setDefault(@CurrentCustomer() customer: AuthenticatedCustomerUser, @Param('id') id: string) {
    return this.customersService.setDefaultAddress(customer.sub, id)
  }
}
