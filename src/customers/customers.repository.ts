import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class CustomersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: true,
        vendorProfile: true,
      },
    })
  }

  getCityBySlug(slug: string) {
    return this.prisma.city.findUnique({
      where: { slug },
    })
  }

  listAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      include: {
        city: true,
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })
  }

  getAddress(userId: string, id: string) {
    return this.prisma.address.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        city: true,
      },
    })
  }

  countAddresses(userId: string) {
    return this.prisma.address.count({
      where: { userId },
    })
  }

  async clearDefaultAddresses(userId: string) {
    await this.prisma.address.updateMany({
      where: {
        userId,
        isDefault: true,
      },
      data: {
        isDefault: false,
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

  updateAddress(id: string, data: Prisma.AddressUncheckedUpdateInput) {
    return this.prisma.address.update({
      where: { id },
      data,
      include: {
        city: true,
      },
    })
  }

  async deleteAddress(id: string) {
    await this.prisma.address.delete({
      where: { id },
    })
  }
}
