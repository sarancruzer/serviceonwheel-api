import { HttpStatus, Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import {
  AssignmentStatus,
  BookingStatus,
  CancelledBy,
  Role,
  SettlementStatus,
} from '@prisma/client'
import { AuditService } from '../audit/audit.service'
import { AppException } from '../common/exceptions/app.exception'
import type {
  AuthenticatedAdminUser,
  AuthenticatedCustomerUser,
} from '../common/interfaces/request-context.interface'
import { generateBookingCode } from '../common/utils/booking-code.util'
import { getIsoWeekString } from '../common/utils/week.util'
import { maskAddress, maskPhone } from '../common/utils/mask.util'
import { authConfig } from '../config/auth.config'
import { ConfigType } from '@nestjs/config'
import { StorageService } from '../storage/storage.service'
import { AuditActorType } from '../common/types/enums'
import { BookingsRepository, BookingAggregate } from './bookings.repository'
import {
  assertBookingStatusTransition,
  canCompleteBooking,
  canCustomerCancel,
} from './domain/booking-status.util'
import { calculateCommissionBreakdown } from './domain/commission.util'
import {
  AdminBookingListQueryDto,
  AssignBookingDto,
  BookingDetailDto,
  BookingListItemDto,
  CancelBookingDto,
  CompleteBookingDto,
  UpdateBookingStatusDto,
} from './dto/admin-bookings.dto'
import {
  CreatePartnerLeadDto,
  CreatePublicBookingDto,
  CreatePublicReviewDto,
  PublicUploadFinalizeDto,
  PublicUploadPresignDto,
} from './dto/public-bookings.dto'

@Injectable()
export class BookingsService {
  constructor(
    private readonly bookingsRepository: BookingsRepository,
    private readonly auditService: AuditService,
    private readonly storageService: StorageService,
    @Inject(authConfig.KEY)
    private readonly settings: ConfigType<typeof authConfig>,
  ) {}

  async createPublicBooking(payload: CreatePublicBookingDto, customer?: AuthenticatedCustomerUser) {
    if (customer && !customer.roles.includes(Role.CUSTOMER)) {
      throw new AppException(
        'CUSTOMER_ROLE_REQUIRED',
        'Authenticated booking creation requires the CUSTOMER role.',
        HttpStatus.FORBIDDEN,
      )
    }

    if (!customer && (!payload.guestName || !payload.guestPhone)) {
      throw new AppException(
        'GUEST_DETAILS_REQUIRED',
        'guestName and guestPhone are required for guest bookings.',
      )
    }

    const context = await this.bookingsRepository.findCatalogContext(
      payload.citySlug,
      payload.categorySlug,
      payload.subServiceSlug,
    )
    const pricingRule = context.pricingRules[0]

    if (!pricingRule) {
      throw new AppException(
        'PRICING_RULE_NOT_FOUND',
        'Pricing rule not found.',
        HttpStatus.NOT_FOUND,
      )
    }

    const address = await this.bookingsRepository.createAddress({
      userId: customer?.sub ?? null,
      cityId: pricingRule.city.id,
      label: payload.address.label ?? null,
      line1: payload.address.line1.trim(),
      landmark: payload.address.landmark?.trim() ?? null,
      pincode: payload.address.pincode.trim(),
      lat: payload.address.lat ?? null,
      lng: payload.address.lng ?? null,
      isDefault: customer ? Boolean(payload.address.isDefault) : false,
    })

    const booking = await this.bookingsRepository.createBooking({
      bookingCode: generateBookingCode(12),
      cityId: pricingRule.city.id,
      categoryId: context.categoryId,
      subServiceId: context.id,
      customerUserId: customer?.sub ?? null,
      guestName: customer ? null : (payload.guestName?.trim() ?? null),
      guestPhone: customer ? null : (payload.guestPhone?.trim() ?? null),
      addressId: address.id,
      scheduledDate: new Date(payload.scheduledDate),
      timeWindow: payload.timeWindow.trim(),
      status: BookingStatus.NEW,
      visitFee: pricingRule.visitFee.toString(),
      estimatedLabor: pricingRule.baseLaborPrice?.toString() ?? null,
      commissionRatePct: this.settings.commissionRatePct,
      notes: payload.notes?.trim() ?? null,
      settlementStatus: SettlementStatus.NA,
    })

    return {
      bookingCode: booking.bookingCode,
      status: booking.status,
      visitFee: booking.visitFee.toString(),
      estimatedLabor: booking.estimatedLabor?.toString() ?? null,
      scheduledDate: booking.scheduledDate.toISOString(),
      timeWindow: booking.timeWindow,
    }
  }

  async getPublicBookingStatus(bookingCode: string) {
    const booking = await this.getBookingByCodeOrThrow(bookingCode)
    const currentProvider = this.getCurrentAssignment(booking)?.vendor.user ?? null

    return {
      bookingCode: booking.bookingCode,
      status: booking.status,
      cityName: booking.city.name,
      categoryName: booking.category.name,
      subServiceName: booking.subService.name,
      maskedCustomerPhone: maskPhone(booking.customerUser?.phone ?? booking.guestPhone ?? null),
      maskedAddress: maskAddress(booking.address.line1),
      providerName: currentProvider?.name ?? null,
      visitFee: booking.visitFee.toString(),
      estimatedLabor: booking.estimatedLabor?.toString() ?? null,
      finalLabor: booking.finalLabor?.toString() ?? null,
      paymentModeUsed: booking.paymentModeUsed ?? null,
      timeline: this.buildTimeline(booking),
    }
  }

  async createReview(payload: CreatePublicReviewDto, customer?: AuthenticatedCustomerUser) {
    const booking = await this.getBookingByCodeOrThrow(payload.bookingCode)

    if (booking.status !== BookingStatus.COMPLETED) {
      throw new AppException('REVIEW_NOT_ALLOWED', 'Review is allowed only for completed bookings.')
    }

    if (booking.review) {
      throw new AppException(
        'REVIEW_ALREADY_EXISTS',
        'Review already submitted.',
        HttpStatus.CONFLICT,
      )
    }

    if (booking.customerUserId) {
      if (!customer) {
        throw new UnauthorizedException('Authentication is required to review this booking.')
      }

      if (customer.sub !== booking.customerUserId) {
        throw new AppException(
          'BOOKING_OWNERSHIP_REQUIRED',
          'You can review only your own booking.',
          HttpStatus.FORBIDDEN,
        )
      }
    }

    return this.bookingsRepository.createReview({
      bookingId: booking.id,
      rating: payload.rating,
      comment: payload.comment?.trim() ?? null,
    })
  }

  createPartnerLead(payload: CreatePartnerLeadDto) {
    return this.bookingsRepository.createPartnerLead({
      name: payload.name.trim(),
      phone: payload.phone.trim(),
      categoriesInterested: payload.categoriesInterested,
      pincodes: payload.pincodes,
      message: payload.message?.trim() ?? null,
    })
  }

  async createPresignedUpload(payload: PublicUploadPresignDto) {
    await this.getBookingByCodeOrThrow(payload.bookingCode)
    return this.storageService.createPresignedUpload(payload)
  }

  async finalizeUpload(payload: PublicUploadFinalizeDto) {
    const booking = await this.getBookingByCodeOrThrow(payload.bookingCode)
    const expectedPrefix = `bookings/${booking.bookingCode}/`

    if (!payload.s3Key.startsWith(expectedPrefix)) {
      throw new AppException(
        'UPLOAD_KEY_INVALID',
        's3Key does not match the booking upload prefix.',
      )
    }

    return this.bookingsRepository.createPhoto({
      bookingId: booking.id,
      kind: payload.kind,
      s3Key: payload.s3Key,
    })
  }

  async listAdminBookings(query: AdminBookingListQueryDto) {
    const bookings = await this.bookingsRepository.listAdminBookings({
      status: query.status,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      categorySlug: query.categorySlug,
      pincode: query.pincode,
      vendorId: query.vendorId,
      search: query.search?.trim(),
    })

    return bookings.map((booking) => this.serializeBookingListItem(booking))
  }

  async getAdminBooking(id: string) {
    const booking = await this.getBookingByIdOrThrow(id)
    return this.serializeBookingDetail(booking)
  }

  async confirmBooking(id: string, admin: AuthenticatedAdminUser) {
    const booking = await this.getBookingByIdOrThrow(id)
    assertBookingStatusTransition(booking.status, BookingStatus.CONFIRMED)

    const updated = await this.bookingsRepository.updateBooking(id, {
      status: BookingStatus.CONFIRMED,
    })

    await this.auditService.log({
      actorType: AuditActorType.ADMIN,
      actorUserId: admin.sub,
      action: 'CONFIRM_BOOKING',
      entityType: 'Booking',
      entityId: id,
      before: this.serializeBookingDetail(booking),
      after: this.serializeBookingDetail(updated),
    })

    return this.serializeBookingDetail(updated)
  }

  async assignBooking(id: string, payload: AssignBookingDto, admin: AuthenticatedAdminUser) {
    const booking = await this.getBookingByIdOrThrow(id)
    const vendor = await this.bookingsRepository.getVendorAssignmentContext(payload.vendorId)

    if (!vendor || !vendor.isActive || !vendor.user.isActive) {
      throw new AppException(
        'VENDOR_NOT_ASSIGNABLE',
        'Vendor is inactive or does not exist.',
        HttpStatus.BAD_REQUEST,
      )
    }

    const hasSkill = vendor.skills.some(
      (skill) => skill.subServiceId === booking.subServiceId && skill.isActive,
    )
    const servesPincode = vendor.serviceAreas.some(
      (area) => area.cityId === booking.cityId && area.pincode === booking.address.pincode,
    )

    if (!hasSkill) {
      throw new AppException(
        'VENDOR_SKILL_MISMATCH',
        'Vendor does not have the required active skill for this booking.',
      )
    }

    if (!servesPincode) {
      throw new AppException(
        'VENDOR_AREA_MISMATCH',
        'Vendor does not serve the booking pincode in this city.',
      )
    }

    const updated = await this.bookingsRepository.reassignBooking(id, payload.vendorId)

    if (!updated) {
      throw new AppException('BOOKING_NOT_FOUND', 'Booking not found.', HttpStatus.NOT_FOUND)
    }

    await this.auditService.log({
      actorType: AuditActorType.ADMIN,
      actorUserId: admin.sub,
      action: 'ASSIGN_BOOKING',
      entityType: 'Booking',
      entityId: id,
      before: this.serializeBookingDetail(booking),
      after: this.serializeBookingDetail(updated),
    })

    return this.serializeBookingDetail(updated)
  }

  async updateBookingStatus(
    id: string,
    payload: UpdateBookingStatusDto,
    admin: AuthenticatedAdminUser,
  ) {
    const restrictedStatuses: BookingStatus[] = [
      BookingStatus.COMPLETED,
      BookingStatus.CANCELLED,
      BookingStatus.ASSIGNED,
    ]

    if (restrictedStatuses.includes(payload.status)) {
      throw new AppException(
        'BOOKING_STATUS_ENDPOINT_RESTRICTED',
        'Use assign, complete, or cancel endpoints for terminal and assignment transitions.',
      )
    }

    const booking = await this.getBookingByIdOrThrow(id)
    assertBookingStatusTransition(booking.status, payload.status)

    const updated =
      payload.status === BookingStatus.IN_PROGRESS
        ? await this.bookingsRepository.moveBookingToInProgress(id)
        : await this.bookingsRepository.updateBooking(id, {
            status: payload.status,
          })

    if (!updated) {
      throw new AppException('BOOKING_NOT_FOUND', 'Booking not found.', HttpStatus.NOT_FOUND)
    }

    await this.auditService.log({
      actorType: AuditActorType.ADMIN,
      actorUserId: admin.sub,
      action: 'UPDATE_BOOKING_STATUS',
      entityType: 'Booking',
      entityId: id,
      before: this.serializeBookingDetail(booking),
      after: this.serializeBookingDetail(updated),
    })

    return this.serializeBookingDetail(updated)
  }

  async completeBooking(id: string, payload: CompleteBookingDto, admin: AuthenticatedAdminUser) {
    const booking = await this.getBookingByIdOrThrow(id)

    if (!canCompleteBooking(booking.status)) {
      throw new AppException(
        'BOOKING_COMPLETE_NOT_ALLOWED',
        `Booking must be ${BookingStatus.ASSIGNED} or ${BookingStatus.IN_PROGRESS} before completion.`,
      )
    }

    const breakdown = calculateCommissionBreakdown(payload.finalLabor, booking.commissionRatePct)
    const currentAssignment = this.getCurrentAssignment(booking)
    const completedAt = new Date()

    const updated = await this.bookingsRepository.completeBooking(id, {
      finalLabor: breakdown.finalLabor,
      commissionAmount: breakdown.commissionAmount,
      payoutAmount: breakdown.payoutAmount,
      partsNote: payload.partsNote?.trim() ?? null,
      paymentModeUsed: payload.paymentModeUsed,
      settlementStatus: currentAssignment ? SettlementStatus.UNSETTLED : SettlementStatus.NA,
      settlementWeek: currentAssignment ? getIsoWeekString(completedAt) : null,
      completedAt,
    })

    if (!updated) {
      throw new AppException('BOOKING_NOT_FOUND', 'Booking not found.', HttpStatus.NOT_FOUND)
    }

    await this.auditService.log({
      actorType: AuditActorType.ADMIN,
      actorUserId: admin.sub,
      action: 'COMPLETE_BOOKING',
      entityType: 'Booking',
      entityId: id,
      before: this.serializeBookingDetail(booking),
      after: this.serializeBookingDetail(updated),
    })

    return this.serializeBookingDetail(updated)
  }

  async cancelBooking(id: string, payload: CancelBookingDto, admin: AuthenticatedAdminUser) {
    const booking = await this.getBookingByIdOrThrow(id)

    const terminalStatuses: BookingStatus[] = [BookingStatus.COMPLETED, BookingStatus.CANCELLED]

    if (terminalStatuses.includes(booking.status)) {
      throw new AppException(
        'BOOKING_CANCEL_NOT_ALLOWED',
        'Completed or cancelled bookings cannot be cancelled again.',
      )
    }

    const updated = await this.bookingsRepository.cancelBooking(id, {
      reason: payload.reason.trim(),
      cancelledBy: CancelledBy.ADMIN,
      cancelledAt: new Date(),
    })

    await this.auditService.log({
      actorType: AuditActorType.ADMIN,
      actorUserId: admin.sub,
      action: 'CANCEL_BOOKING',
      entityType: 'Booking',
      entityId: id,
      before: this.serializeBookingDetail(booking),
      after: this.serializeBookingDetail(updated),
    })

    return this.serializeBookingDetail(updated)
  }

  async getBookingPhotos(id: string) {
    await this.getBookingByIdOrThrow(id)
    return this.bookingsRepository.listPhotos(id)
  }

  async listCustomerBookings(
    userId: string,
    query: { status?: BookingStatus; dateFrom?: string; dateTo?: string },
  ) {
    const bookings = await this.bookingsRepository.listCustomerBookings(userId, {
      status: query.status,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
    })

    return bookings.map((booking) => this.serializeBookingListItem(booking))
  }

  async getCustomerBooking(userId: string, bookingCode: string) {
    const booking = await this.bookingsRepository.findCustomerBookingByCode(userId, bookingCode)

    if (!booking) {
      throw new AppException('BOOKING_NOT_FOUND', 'Booking not found.', HttpStatus.NOT_FOUND)
    }

    return this.serializeBookingDetail(booking)
  }

  async createCustomerBooking(
    userId: string,
    payload: Omit<CreatePublicBookingDto, 'guestName' | 'guestPhone' | 'address'> & {
      addressId?: string
      address?: CreatePublicBookingDto['address']
    },
  ) {
    const catalog = await this.bookingsRepository.findCatalogContext(
      payload.citySlug,
      payload.categorySlug,
      payload.subServiceSlug,
    )
    const pricingRule = catalog.pricingRules[0]

    if (!pricingRule) {
      throw new AppException(
        'PRICING_RULE_NOT_FOUND',
        'Pricing rule not found.',
        HttpStatus.NOT_FOUND,
      )
    }

    const address =
      payload.addressId !== undefined
        ? await this.bookingsRepository.getAddressForUser(payload.addressId, userId)
        : await this.bookingsRepository.createAddress({
            userId,
            cityId: pricingRule.city.id,
            label: payload.address?.label ?? null,
            line1: payload.address?.line1.trim() ?? '',
            landmark: payload.address?.landmark?.trim() ?? null,
            pincode: payload.address?.pincode.trim() ?? '',
            lat: payload.address?.lat ?? null,
            lng: payload.address?.lng ?? null,
            isDefault: Boolean(payload.address?.isDefault),
          })

    if (!address) {
      throw new AppException(
        'ADDRESS_NOT_FOUND',
        'Address not found for this customer.',
        HttpStatus.NOT_FOUND,
      )
    }

    if (address.city.slug !== payload.citySlug) {
      throw new AppException(
        'ADDRESS_CITY_MISMATCH',
        'Selected address city does not match citySlug.',
      )
    }

    const booking = await this.bookingsRepository.createBooking({
      bookingCode: generateBookingCode(12),
      cityId: pricingRule.city.id,
      categoryId: catalog.categoryId,
      subServiceId: catalog.id,
      customerUserId: userId,
      guestName: null,
      guestPhone: null,
      addressId: address.id,
      scheduledDate: new Date(payload.scheduledDate),
      timeWindow: payload.timeWindow.trim(),
      status: BookingStatus.NEW,
      visitFee: pricingRule.visitFee.toString(),
      estimatedLabor: pricingRule.baseLaborPrice?.toString() ?? null,
      commissionRatePct: this.settings.commissionRatePct,
      notes: payload.notes?.trim() ?? null,
      settlementStatus: SettlementStatus.NA,
    })

    return {
      bookingCode: booking.bookingCode,
      status: booking.status,
      visitFee: booking.visitFee.toString(),
      estimatedLabor: booking.estimatedLabor?.toString() ?? null,
      scheduledDate: booking.scheduledDate.toISOString(),
      timeWindow: booking.timeWindow,
    }
  }

  async cancelCustomerBooking(userId: string, bookingCode: string, payload: CancelBookingDto) {
    const booking = await this.bookingsRepository.findCustomerBookingByCode(userId, bookingCode)

    if (!booking) {
      throw new AppException('BOOKING_NOT_FOUND', 'Booking not found.', HttpStatus.NOT_FOUND)
    }

    if (!canCustomerCancel(booking.status)) {
      throw new AppException(
        'BOOKING_CANCEL_NOT_ALLOWED',
        'Customers can cancel only NEW or CONFIRMED bookings.',
      )
    }

    const updated = await this.bookingsRepository.cancelBooking(booking.id, {
      reason: payload.reason.trim(),
      cancelledBy: CancelledBy.CUSTOMER,
      cancelledAt: new Date(),
    })

    await this.auditService.log({
      actorType: AuditActorType.CUSTOMER,
      actorUserId: userId,
      action: 'CUSTOMER_CANCEL_BOOKING',
      entityType: 'Booking',
      entityId: booking.id,
      before: this.serializeBookingDetail(booking),
      after: this.serializeBookingDetail(updated),
    })

    return this.serializeBookingDetail(updated)
  }

  private async getBookingByCodeOrThrow(bookingCode: string) {
    const booking = await this.bookingsRepository.findBookingByCode(bookingCode)

    if (!booking) {
      throw new AppException('BOOKING_NOT_FOUND', 'Booking not found.', HttpStatus.NOT_FOUND)
    }

    return booking
  }

  private async getBookingByIdOrThrow(id: string) {
    const booking = await this.bookingsRepository.findBookingById(id)

    if (!booking) {
      throw new AppException('BOOKING_NOT_FOUND', 'Booking not found.', HttpStatus.NOT_FOUND)
    }

    return booking
  }

  private getCurrentAssignment(booking: BookingAggregate) {
    const activeAssignmentStatuses: AssignmentStatus[] = [
      AssignmentStatus.ASSIGNED,
      AssignmentStatus.ACCEPTED,
    ]

    return booking.assignments.find((assignment) =>
      activeAssignmentStatuses.includes(assignment.assignmentStatus),
    )
  }

  private buildTimeline(booking: BookingAggregate) {
    const timeline: Array<{ status: BookingStatus; at: string }> = [
      {
        status: BookingStatus.NEW,
        at: booking.createdAt.toISOString(),
      },
    ]

    const assignment = this.getCurrentAssignment(booking)

    if (booking.status === BookingStatus.CONFIRMED) {
      timeline.push({
        status: BookingStatus.CONFIRMED,
        at: booking.updatedAt.toISOString(),
      })
    }

    if (assignment) {
      timeline.push({
        status: BookingStatus.ASSIGNED,
        at: assignment.assignedAt.toISOString(),
      })
    }

    if (assignment?.acceptedAt) {
      timeline.push({
        status: BookingStatus.IN_PROGRESS,
        at: assignment.acceptedAt.toISOString(),
      })
    }

    if (booking.completedAt) {
      timeline.push({
        status: BookingStatus.COMPLETED,
        at: booking.completedAt.toISOString(),
      })
    }

    if (booking.cancelledAt) {
      timeline.push({
        status: BookingStatus.CANCELLED,
        at: booking.cancelledAt.toISOString(),
      })
    }

    return timeline
  }

  private serializeBookingListItem(booking: BookingAggregate): BookingListItemDto {
    const currentAssignment = this.getCurrentAssignment(booking)

    return {
      id: booking.id,
      bookingCode: booking.bookingCode,
      status: booking.status,
      cityName: booking.city.name,
      categoryName: booking.category.name,
      subServiceName: booking.subService.name,
      scheduledDate: booking.scheduledDate.toISOString(),
      timeWindow: booking.timeWindow,
      visitFee: booking.visitFee.toString(),
      estimatedLabor: booking.estimatedLabor?.toString() ?? null,
      finalLabor: booking.finalLabor?.toString() ?? null,
      settlementStatus: booking.settlementStatus,
      customerName: booking.customerUser?.name ?? booking.guestName ?? 'Guest Customer',
      customerPhone: booking.customerUser?.phone ?? booking.guestPhone ?? null,
      providerName: currentAssignment?.vendor.user.name ?? null,
      createdAt: booking.createdAt.toISOString(),
    }
  }

  private serializeBookingDetail(booking: BookingAggregate): BookingDetailDto {
    const listItem = this.serializeBookingListItem(booking)

    return {
      ...listItem,
      commissionRatePct: booking.commissionRatePct,
      commissionAmount: booking.commissionAmount?.toString() ?? null,
      payoutAmount: booking.payoutAmount?.toString() ?? null,
      partsNote: booking.partsNote,
      customerNote: booking.notes,
      paymentModeUsed: booking.paymentModeUsed ?? null,
      settlementWeek: booking.settlementWeek,
      settlementRef: booking.settlementRef,
      customer: {
        id: booking.customerUser?.id ?? null,
        name: booking.customerUser?.name ?? booking.guestName ?? 'Guest Customer',
        email: booking.customerUser?.email ?? null,
        phone: booking.customerUser?.phone ?? booking.guestPhone ?? null,
      },
      address: {
        id: booking.address.id,
        cityName: booking.address.city.name,
        citySlug: booking.address.city.slug,
        label: booking.address.label,
        line1: booking.address.line1,
        landmark: booking.address.landmark,
        pincode: booking.address.pincode,
        lat: booking.address.lat?.toString() ?? null,
        lng: booking.address.lng?.toString() ?? null,
        isDefault: booking.address.isDefault,
      },
      assignments: booking.assignments.map((assignment) => ({
        id: assignment.id,
        vendorId: assignment.vendorId,
        vendorName: assignment.vendor.user.name,
        vendorPhone: assignment.vendor.user.phone,
        assignmentStatus: assignment.assignmentStatus,
        assignedAt: assignment.assignedAt.toISOString(),
        acceptedAt: assignment.acceptedAt?.toISOString() ?? null,
        completedAt: assignment.completedAt?.toISOString() ?? null,
      })),
      photos: booking.photos.map((photo) => ({
        id: photo.id,
        s3Key: photo.s3Key,
        kind: photo.kind,
        createdAt: photo.createdAt.toISOString(),
      })),
      review: booking.review
        ? {
            id: booking.review.id,
            rating: booking.review.rating,
            comment: booking.review.comment,
            createdAt: booking.review.createdAt.toISOString(),
          }
        : null,
      completedAt: booking.completedAt?.toISOString() ?? null,
      cancelledAt: booking.cancelledAt?.toISOString() ?? null,
      cancelReason: booking.cancelReason,
    }
  }
}
