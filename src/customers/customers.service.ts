import { HttpStatus, Injectable } from '@nestjs/common'
import type { Role } from '@prisma/client'
import { BookingsService } from '../bookings/bookings.service'
import { AppException } from '../common/exceptions/app.exception'
import { CustomersRepository } from './customers.repository'
import {
  CancelCustomerBookingDto,
  CreateAddressDto,
  CreateCustomerBookingDto,
  CustomerBookingQueryDto,
  UpdateAddressDto,
} from './dto/customers.dto'

@Injectable()
export class CustomersService {
  constructor(
    private readonly customersRepository: CustomersRepository,
    private readonly bookingsService: BookingsService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.customersRepository.findUserProfile(userId)

    if (!user) {
      throw new AppException('USER_NOT_FOUND', 'Customer profile not found.', HttpStatus.NOT_FOUND)
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      isActive: user.isActive,
      roles: user.roles.map((role) => role.role as Role),
    }
  }

  async listAddresses(userId: string) {
    const addresses = await this.customersRepository.listAddresses(userId)
    return addresses.map((address) => this.serializeAddress(address))
  }

  async createAddress(userId: string, payload: CreateAddressDto) {
    const city = await this.customersRepository.getCityBySlug(payload.citySlug)

    if (!city) {
      throw new AppException('CITY_NOT_FOUND', 'City not found.', HttpStatus.NOT_FOUND)
    }

    const addressCount = await this.customersRepository.countAddresses(userId)
    const shouldBeDefault = payload.isDefault ?? addressCount === 0

    if (shouldBeDefault) {
      await this.customersRepository.clearDefaultAddresses(userId)
    }

    const address = await this.customersRepository.createAddress({
      userId,
      cityId: city.id,
      label: payload.label?.trim() ?? null,
      line1: payload.line1.trim(),
      landmark: payload.landmark?.trim() ?? null,
      pincode: payload.pincode.trim(),
      lat: payload.lat ?? null,
      lng: payload.lng ?? null,
      isDefault: shouldBeDefault,
    })

    return this.serializeAddress(address)
  }

  async updateAddress(userId: string, id: string, payload: UpdateAddressDto) {
    const existingAddress = await this.customersRepository.getAddress(userId, id)

    if (!existingAddress) {
      throw new AppException('ADDRESS_NOT_FOUND', 'Address not found.', HttpStatus.NOT_FOUND)
    }

    let cityId = existingAddress.cityId

    if (payload.citySlug) {
      const city = await this.customersRepository.getCityBySlug(payload.citySlug)

      if (!city) {
        throw new AppException('CITY_NOT_FOUND', 'City not found.', HttpStatus.NOT_FOUND)
      }

      cityId = city.id
    }

    if (payload.isDefault) {
      await this.customersRepository.clearDefaultAddresses(userId)
    }

    const updated = await this.customersRepository.updateAddress(id, {
      cityId,
      label: payload.label?.trim(),
      line1: payload.line1?.trim(),
      landmark: payload.landmark?.trim(),
      pincode: payload.pincode?.trim(),
      lat: payload.lat,
      lng: payload.lng,
      isDefault: payload.isDefault,
    })

    return this.serializeAddress(updated)
  }

  async deleteAddress(userId: string, id: string) {
    const address = await this.customersRepository.getAddress(userId, id)

    if (!address) {
      throw new AppException('ADDRESS_NOT_FOUND', 'Address not found.', HttpStatus.NOT_FOUND)
    }

    await this.customersRepository.deleteAddress(id)
    return {
      message: 'Address deleted successfully.',
    }
  }

  async setDefaultAddress(userId: string, id: string) {
    const address = await this.customersRepository.getAddress(userId, id)

    if (!address) {
      throw new AppException('ADDRESS_NOT_FOUND', 'Address not found.', HttpStatus.NOT_FOUND)
    }

    await this.customersRepository.clearDefaultAddresses(userId)
    const updated = await this.customersRepository.updateAddress(id, {
      isDefault: true,
    })

    return this.serializeAddress(updated)
  }

  listBookings(userId: string, query: CustomerBookingQueryDto) {
    return this.bookingsService.listCustomerBookings(userId, query)
  }

  getBooking(userId: string, bookingCode: string) {
    return this.bookingsService.getCustomerBooking(userId, bookingCode)
  }

  async createBooking(userId: string, payload: CreateCustomerBookingDto) {
    if (!payload.addressId && !payload.address) {
      throw new AppException(
        'ADDRESS_REQUIRED',
        'Either addressId or address object is required for customer booking.',
      )
    }

    return this.bookingsService.createCustomerBooking(userId, {
      citySlug: payload.citySlug,
      categorySlug: payload.categorySlug,
      subServiceSlug: payload.subServiceSlug,
      addressId: payload.addressId,
      address:
        payload.address ??
        ({
          line1: '',
          pincode: '',
        } as CreateCustomerBookingDto['address']),
      scheduledDate: payload.scheduledDate,
      timeWindow: payload.timeWindow,
      notes: payload.notes,
    })
  }

  cancelBooking(userId: string, bookingCode: string, payload: CancelCustomerBookingDto) {
    return this.bookingsService.cancelCustomerBooking(userId, bookingCode, {
      reason: payload.reason,
    })
  }

  private serializeAddress(address: Awaited<ReturnType<CustomersRepository['getAddress']>>) {
    if (!address) {
      throw new AppException('ADDRESS_NOT_FOUND', 'Address not found.', HttpStatus.NOT_FOUND)
    }

    return {
      id: address.id,
      cityName: address.city.name,
      citySlug: address.city.slug,
      label: address.label,
      line1: address.line1,
      landmark: address.landmark,
      pincode: address.pincode,
      lat: address.lat?.toString() ?? null,
      lng: address.lng?.toString() ?? null,
      isDefault: address.isDefault,
    }
  }
}
