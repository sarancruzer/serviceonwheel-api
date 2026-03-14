import { Injectable } from '@nestjs/common'
import { Role, User, UserRole, VendorProfile } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

export type VendorProfileAggregate = VendorProfile & {
  user: User & {
    roles: UserRole[]
  }
  serviceAreas: Array<{
    id: string
    cityId: string
    pincode: string
    areaName: string | null
    city: {
      id: string
      name: string
      slug: string
    }
  }>
  skills: Array<{
    id: string
    subServiceId: string
    isActive: boolean
    subService: {
      id: string
      name: string
      slug: string
      category: {
        id: string
        name: string
        slug: string
      }
    }
  }>
}

@Injectable()
export class ProvidersRepository {
  constructor(private readonly prisma: PrismaService) {}

  listVendors(): Promise<VendorProfileAggregate[]> {
    return this.prisma.vendorProfile.findMany({
      include: {
        user: {
          include: {
            roles: true,
          },
        },
        serviceAreas: {
          include: {
            city: true,
          },
        },
        skills: {
          include: {
            subService: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  getVendorById(vendorId: string): Promise<VendorProfileAggregate> {
    return this.prisma.vendorProfile.findUniqueOrThrow({
      where: { id: vendorId },
      include: {
        user: {
          include: {
            roles: true,
          },
        },
        serviceAreas: {
          include: {
            city: true,
          },
        },
        skills: {
          include: {
            subService: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    })
  }

  getVendorByUserId(userId: string): Promise<VendorProfileAggregate | null> {
    return this.prisma.vendorProfile.findUnique({
      where: { userId },
      include: {
        user: {
          include: {
            roles: true,
          },
        },
        serviceAreas: {
          include: {
            city: true,
          },
        },
        skills: {
          include: {
            subService: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    })
  }

  async createVendor(params: {
    userId?: string
    email?: string
    passwordHash?: string
    name?: string
    phone?: string | null
    kycStatus: VendorProfile['kycStatus']
    isActive: boolean
  }): Promise<VendorProfileAggregate> {
    const vendor = await this.prisma.$transaction(async (tx) => {
      let userId = params.userId

      if (userId) {
        await tx.userRole.upsert({
          where: {
            userId_role: {
              userId,
              role: Role.VENDOR,
            },
          },
          update: {},
          create: {
            userId,
            role: Role.VENDOR,
          },
        })
      } else {
        const createdUser = await tx.user.create({
          data: {
            email: params.email!,
            passwordHash: params.passwordHash!,
            name: params.name!,
            phone: params.phone ?? null,
            roles: {
              create: [{ role: Role.VENDOR }],
            },
          },
        })
        userId = createdUser.id
      }

      return tx.vendorProfile.upsert({
        where: { userId },
        update: {
          kycStatus: params.kycStatus,
          isActive: params.isActive,
        },
        create: {
          userId,
          kycStatus: params.kycStatus,
          isActive: params.isActive,
        },
      })
    })

    return this.getVendorById(vendor.id)
  }

  async updateVendor(
    vendorId: string,
    params: {
      name?: string
      phone?: string | null
      kycStatus?: VendorProfile['kycStatus']
      isActive?: boolean
    },
  ): Promise<VendorProfileAggregate> {
    const vendor = await this.getVendorById(vendorId)

    await this.prisma.$transaction(async (tx) => {
      if (params.name !== undefined || params.phone !== undefined) {
        await tx.user.update({
          where: { id: vendor.userId },
          data: {
            name: params.name ?? vendor.user.name,
            phone: params.phone ?? vendor.user.phone,
          },
        })
      }

      await tx.vendorProfile.update({
        where: { id: vendorId },
        data: {
          kycStatus: params.kycStatus,
          isActive: params.isActive,
        },
      })
    })

    return this.getVendorById(vendorId)
  }

  async deactivateVendor(vendorId: string): Promise<VendorProfileAggregate> {
    await this.prisma.vendorProfile.update({
      where: { id: vendorId },
      data: { isActive: false },
    })

    return this.getVendorById(vendorId)
  }

  async updateVendorSelf(userId: string, params: { name?: string; phone?: string | null }) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: params.name,
        phone: params.phone,
      },
    })

    return this.getVendorByUserId(userId)
  }

  addVendorArea(
    vendorId: string,
    data: { cityId: string; pincode: string; areaName?: string | null },
  ) {
    return this.prisma.vendorServiceArea.create({
      data: {
        vendorId,
        cityId: data.cityId,
        pincode: data.pincode,
        areaName: data.areaName ?? null,
      },
      include: {
        city: true,
      },
    })
  }

  addVendorSkill(vendorId: string, data: { subServiceId: string; isActive?: boolean }) {
    return this.prisma.vendorSkill.create({
      data: {
        vendorId,
        subServiceId: data.subServiceId,
        isActive: data.isActive ?? true,
      },
      include: {
        subService: {
          include: {
            category: true,
          },
        },
      },
    })
  }
}
