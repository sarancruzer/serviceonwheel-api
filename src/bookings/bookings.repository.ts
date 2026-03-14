import { Injectable } from '@nestjs/common'
import {
  AssignmentStatus,
  BookingStatus,
  CancelledBy,
  PaymentMode,
  PhotoKind,
  Prisma,
  SettlementStatus,
} from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

const bookingInclude = {
  city: true,
  category: true,
  subService: {
    include: {
      category: true,
    },
  },
  customerUser: {
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
    },
  },
  address: {
    include: {
      city: true,
    },
  },
  assignments: {
    include: {
      vendor: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      assignedAt: 'desc',
    },
  },
  photos: {
    orderBy: {
      createdAt: 'desc',
    },
  },
  review: true,
} satisfies Prisma.BookingInclude

export type BookingAggregate = Prisma.BookingGetPayload<{
  include: typeof bookingInclude
}>

@Injectable()
export class BookingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCatalogContext(citySlug: string, categorySlug: string, subServiceSlug: string) {
    return this.prisma.subService.findFirstOrThrow({
      where: {
        slug: subServiceSlug,
        isActive: true,
        category: {
          slug: categorySlug,
          isActive: true,
        },
        pricingRules: {
          some: {
            city: {
              slug: citySlug,
              isActive: true,
            },
            isActive: true,
          },
        },
      },
      include: {
        category: true,
        pricingRules: {
          where: {
            city: {
              slug: citySlug,
              isActive: true,
            },
            isActive: true,
          },
          include: {
            city: true,
          },
          take: 1,
        },
      },
    })
  }

  createAddress(data: Prisma.AddressUncheckedCreateInput) {
    return this.prisma.address.create({
      data,
      include: {
        city: true,
      },
    })
  }

  getAddressForUser(addressId: string, userId: string) {
    return this.prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
      include: {
        city: true,
      },
    })
  }

  createBooking(data: Prisma.BookingUncheckedCreateInput) {
    return this.prisma.booking.create({
      data,
      include: bookingInclude,
    })
  }

  findBookingByCode(bookingCode: string) {
    return this.prisma.booking.findUnique({
      where: { bookingCode },
      include: bookingInclude,
    })
  }

  findBookingById(id: string) {
    return this.prisma.booking.findUnique({
      where: { id },
      include: bookingInclude,
    })
  }

  listAdminBookings(filters: {
    status?: BookingStatus
    dateFrom?: Date
    dateTo?: Date
    categorySlug?: string
    pincode?: string
    vendorId?: string
    search?: string
  }) {
    return this.prisma.booking.findMany({
      where: {
        status: filters.status,
        scheduledDate:
          filters.dateFrom || filters.dateTo
            ? {
                gte: filters.dateFrom,
                lte: filters.dateTo,
              }
            : undefined,
        category: filters.categorySlug
          ? {
              slug: filters.categorySlug,
            }
          : undefined,
        address: filters.pincode
          ? {
              pincode: filters.pincode,
            }
          : undefined,
        assignments: filters.vendorId
          ? {
              some: {
                vendorId: filters.vendorId,
                assignmentStatus: {
                  in: [AssignmentStatus.ASSIGNED, AssignmentStatus.ACCEPTED],
                },
              },
            }
          : undefined,
        OR: filters.search
          ? [
              {
                bookingCode: {
                  contains: filters.search,
                  mode: 'insensitive',
                },
              },
              {
                guestPhone: {
                  contains: filters.search,
                },
              },
              {
                customerUser: {
                  email: {
                    contains: filters.search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                customerUser: {
                  phone: {
                    contains: filters.search,
                  },
                },
              },
            ]
          : undefined,
      },
      include: bookingInclude,
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  listCustomerBookings(
    userId: string,
    filters: { status?: BookingStatus; dateFrom?: Date; dateTo?: Date },
  ) {
    return this.prisma.booking.findMany({
      where: {
        customerUserId: userId,
        status: filters.status,
        scheduledDate:
          filters.dateFrom || filters.dateTo
            ? {
                gte: filters.dateFrom,
                lte: filters.dateTo,
              }
            : undefined,
      },
      include: bookingInclude,
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  findCustomerBookingByCode(userId: string, bookingCode: string) {
    return this.prisma.booking.findFirst({
      where: {
        bookingCode,
        customerUserId: userId,
      },
      include: bookingInclude,
    })
  }

  updateBooking(id: string, data: Prisma.BookingUncheckedUpdateInput) {
    return this.prisma.booking.update({
      where: { id },
      data,
      include: bookingInclude,
    })
  }

  async reassignBooking(bookingId: string, vendorId: string) {
    await this.prisma.$transaction([
      this.prisma.bookingAssignment.updateMany({
        where: {
          bookingId,
          assignmentStatus: {
            in: [AssignmentStatus.ASSIGNED, AssignmentStatus.ACCEPTED],
          },
        },
        data: {
          assignmentStatus: AssignmentStatus.REMOVED,
        },
      }),
      this.prisma.bookingAssignment.create({
        data: {
          bookingId,
          vendorId,
          assignmentStatus: AssignmentStatus.ASSIGNED,
        },
      }),
      this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.ASSIGNED,
        },
      }),
    ])

    return this.findBookingById(bookingId)
  }

  async moveBookingToInProgress(bookingId: string) {
    await this.prisma.$transaction([
      this.prisma.bookingAssignment.updateMany({
        where: {
          bookingId,
          assignmentStatus: AssignmentStatus.ASSIGNED,
        },
        data: {
          assignmentStatus: AssignmentStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
      }),
      this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.IN_PROGRESS,
        },
      }),
    ])

    return this.findBookingById(bookingId)
  }

  async completeBooking(
    bookingId: string,
    data: {
      finalLabor: string
      commissionAmount: string
      payoutAmount: string
      partsNote?: string | null
      paymentModeUsed: PaymentMode
      settlementStatus: SettlementStatus
      settlementWeek?: string | null
      completedAt: Date
    },
  ) {
    await this.prisma.$transaction([
      this.prisma.bookingAssignment.updateMany({
        where: {
          bookingId,
          assignmentStatus: {
            in: [AssignmentStatus.ASSIGNED, AssignmentStatus.ACCEPTED],
          },
        },
        data: {
          assignmentStatus: AssignmentStatus.ACCEPTED,
          acceptedAt: data.completedAt,
          completedAt: data.completedAt,
        },
      }),
      this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.COMPLETED,
          finalLabor: data.finalLabor,
          commissionAmount: data.commissionAmount,
          payoutAmount: data.payoutAmount,
          partsNote: data.partsNote ?? null,
          paymentModeUsed: data.paymentModeUsed,
          settlementStatus: data.settlementStatus,
          settlementWeek: data.settlementWeek ?? null,
          completedAt: data.completedAt,
        },
      }),
    ])

    return this.findBookingById(bookingId)
  }

  cancelBooking(
    bookingId: string,
    data: { reason: string; cancelledBy: CancelledBy; cancelledAt: Date },
  ) {
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
        cancelReason: data.reason,
        cancelledBy: data.cancelledBy,
        cancelledAt: data.cancelledAt,
        settlementStatus: SettlementStatus.NA,
      },
      include: bookingInclude,
    })
  }

  createReview(data: Prisma.ReviewUncheckedCreateInput) {
    return this.prisma.review.create({
      data,
    })
  }

  createPartnerLead(data: Prisma.PartnerLeadCreateInput) {
    return this.prisma.partnerLead.create({
      data,
    })
  }

  createPhoto(data: { bookingId: string; kind: PhotoKind; s3Key: string }) {
    return this.prisma.bookingPhoto.create({
      data,
    })
  }

  listPhotos(bookingId: string) {
    return this.prisma.bookingPhoto.findMany({
      where: { bookingId },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  getVendorAssignmentContext(vendorId: string) {
    return this.prisma.vendorProfile.findUnique({
      where: { id: vendorId },
      include: {
        user: true,
        serviceAreas: true,
        skills: true,
      },
    })
  }
}
