import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Role } from '@prisma/client'
import { CurrentCustomer } from '../common/decorators/current-customer.decorator'
import { Roles } from '../common/decorators/roles.decorator'
import type { AuthenticatedCustomerUser } from '../common/interfaces/request-context.interface'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { CustomersService } from './customers.service'
import {
  CancelCustomerBookingDto,
  CreateCustomerBookingDto,
  CustomerBookingQueryDto,
} from './dto/customers.dto'
import { BookingDetailDto, BookingListItemDto } from '../bookings/dto/admin-bookings.dto'
import { PublicBookingCreatedResponseDto } from '../bookings/dto/public-bookings.dto'

@ApiTags('Customer Bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CUSTOMER)
@Controller('customer/bookings')
export class CustomerBookingsController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'List customer bookings' })
  @ApiOkResponse({ type: BookingListItemDto, isArray: true })
  list(
    @CurrentCustomer() customer: AuthenticatedCustomerUser,
    @Query() query: CustomerBookingQueryDto,
  ) {
    return this.customersService.listBookings(customer.sub, query)
  }

  @Get(':bookingCode')
  @ApiOperation({ summary: 'Get customer booking details by booking code' })
  @ApiOkResponse({ type: BookingDetailDto })
  getBooking(
    @CurrentCustomer() customer: AuthenticatedCustomerUser,
    @Param('bookingCode') bookingCode: string,
  ) {
    return this.customersService.getBooking(customer.sub, bookingCode)
  }

  @Post()
  @ApiOperation({ summary: 'Create a customer booking bound to the authenticated user' })
  @ApiOkResponse({ type: PublicBookingCreatedResponseDto })
  create(
    @CurrentCustomer() customer: AuthenticatedCustomerUser,
    @Body() payload: CreateCustomerBookingDto,
  ) {
    return this.customersService.createBooking(customer.sub, payload)
  }

  @Post(':bookingCode/cancel')
  @ApiOperation({ summary: 'Cancel own booking when allowed' })
  @ApiOkResponse({ type: BookingDetailDto })
  cancel(
    @CurrentCustomer() customer: AuthenticatedCustomerUser,
    @Param('bookingCode') bookingCode: string,
    @Body() payload: CancelCustomerBookingDto,
  ) {
    return this.customersService.cancelBooking(customer.sub, bookingCode, payload)
  }
}
