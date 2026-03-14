import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { CurrentCustomer } from '../common/decorators/current-customer.decorator'
import { OptionalCustomerJwtAuthGuard } from '../common/guards/optional-customer-jwt-auth.guard'
import type { AuthenticatedCustomerUser } from '../common/interfaces/request-context.interface'
import { BookingsService } from './bookings.service'
import {
  CreatePartnerLeadDto,
  CreatePublicBookingDto,
  CreatePublicReviewDto,
  PublicBookingCreatedResponseDto,
  PublicBookingStatusResponseDto,
  PublicUploadFinalizeDto,
  PublicUploadPresignDto,
  UploadPresignResponseDto,
} from './dto/public-bookings.dto'
import { BookingReviewDto, BookingPhotoDto } from './dto/admin-bookings.dto'

@ApiTags('Public Bookings')
@Controller('public')
export class PublicBookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post('bookings')
  @UseGuards(OptionalCustomerJwtAuthGuard)
  @Throttle({ default: { limit: 12, ttl: 60_000 } })
  @ApiOperation({ summary: 'Create a public or authenticated customer booking' })
  @ApiOkResponse({ type: PublicBookingCreatedResponseDto })
  createBooking(
    @Body() payload: CreatePublicBookingDto,
    @CurrentCustomer() customer?: AuthenticatedCustomerUser,
  ) {
    return this.bookingsService.createPublicBooking(payload, customer)
  }

  @Get('bookings/:bookingCode')
  @ApiOperation({ summary: 'Get masked public booking status' })
  @ApiOkResponse({ type: PublicBookingStatusResponseDto })
  getBookingStatus(@Param('bookingCode') bookingCode: string) {
    return this.bookingsService.getPublicBookingStatus(bookingCode)
  }

  @Post('reviews')
  @UseGuards(OptionalCustomerJwtAuthGuard)
  @ApiOperation({ summary: 'Submit review for a completed booking' })
  @ApiOkResponse({ type: BookingReviewDto })
  createReview(
    @Body() payload: CreatePublicReviewDto,
    @CurrentCustomer() customer?: AuthenticatedCustomerUser,
  ) {
    return this.bookingsService.createReview(payload, customer)
  }

  @Post('partner-leads')
  @ApiOperation({ summary: 'Create partner lead' })
  @ApiOkResponse({
    schema: {
      example: {
        id: 'partner-lead-id',
        name: 'Muthu Service Works',
      },
    },
  })
  createPartnerLead(@Body() payload: CreatePartnerLeadDto) {
    return this.bookingsService.createPartnerLead(payload)
  }

  @Post('uploads/presign')
  @ApiOperation({ summary: 'Generate S3 pre-signed upload URL for booking photos' })
  @ApiOkResponse({ type: UploadPresignResponseDto })
  presignUpload(@Body() payload: PublicUploadPresignDto) {
    return this.bookingsService.createPresignedUpload(payload)
  }

  @Post('uploads/finalize')
  @ApiOperation({ summary: 'Finalize uploaded booking photo and attach to booking' })
  @ApiOkResponse({ type: BookingPhotoDto })
  finalizeUpload(@Body() payload: PublicUploadFinalizeDto) {
    return this.bookingsService.finalizeUpload(payload)
  }
}
