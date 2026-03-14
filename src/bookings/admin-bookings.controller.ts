import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Role } from '@prisma/client'
import { CurrentAdmin } from '../common/decorators/current-admin.decorator'
import { Roles } from '../common/decorators/roles.decorator'
import type { AuthenticatedAdminUser } from '../common/interfaces/request-context.interface'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { BookingsService } from './bookings.service'
import {
  AdminBookingListQueryDto,
  AssignBookingDto,
  BookingDetailDto,
  BookingListItemDto,
  BookingPhotoDto,
  CancelBookingDto,
  CompleteBookingDto,
  UpdateBookingStatusDto,
} from './dto/admin-bookings.dto'

@ApiTags('Admin Bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/bookings')
export class AdminBookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @ApiOperation({ summary: 'List bookings with admin filters' })
  @ApiOkResponse({ type: BookingListItemDto, isArray: true })
  listBookings(@Query() query: AdminBookingListQueryDto) {
    return this.bookingsService.listAdminBookings(query)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking details by id' })
  @ApiOkResponse({ type: BookingDetailDto })
  getBooking(@Param('id') id: string) {
    return this.bookingsService.getAdminBooking(id)
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm booking' })
  @ApiOkResponse({ type: BookingDetailDto })
  confirmBooking(@Param('id') id: string, @CurrentAdmin() admin: AuthenticatedAdminUser) {
    return this.bookingsService.confirmBooking(id, admin)
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assign booking to vendor' })
  @ApiOkResponse({ type: BookingDetailDto })
  assignBooking(
    @Param('id') id: string,
    @Body() payload: AssignBookingDto,
    @CurrentAdmin() admin: AuthenticatedAdminUser,
  ) {
    return this.bookingsService.assignBooking(id, payload, admin)
  }

  @Post(':id/status')
  @ApiOperation({ summary: 'Update booking operational status' })
  @ApiOkResponse({ type: BookingDetailDto })
  updateStatus(
    @Param('id') id: string,
    @Body() payload: UpdateBookingStatusDto,
    @CurrentAdmin() admin: AuthenticatedAdminUser,
  ) {
    return this.bookingsService.updateBookingStatus(id, payload, admin)
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete booking and calculate commissions' })
  @ApiOkResponse({ type: BookingDetailDto })
  completeBooking(
    @Param('id') id: string,
    @Body() payload: CompleteBookingDto,
    @CurrentAdmin() admin: AuthenticatedAdminUser,
  ) {
    return this.bookingsService.completeBooking(id, payload, admin)
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel booking as admin' })
  @ApiOkResponse({ type: BookingDetailDto })
  cancelBooking(
    @Param('id') id: string,
    @Body() payload: CancelBookingDto,
    @CurrentAdmin() admin: AuthenticatedAdminUser,
  ) {
    return this.bookingsService.cancelBooking(id, payload, admin)
  }

  @Get(':id/photos')
  @ApiOperation({ summary: 'List booking photos' })
  @ApiOkResponse({ type: BookingPhotoDto, isArray: true })
  getPhotos(@Param('id') id: string) {
    return this.bookingsService.getBookingPhotos(id)
  }
}
