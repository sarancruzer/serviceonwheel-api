import { HttpStatus, Injectable } from '@nestjs/common'
import { AuditActorType, KycStatus } from '@prisma/client'
import { AuditService } from '../audit/audit.service'
import { AppException } from '../common/exceptions/app.exception'
import type { AuthenticatedAdminUser } from '../common/interfaces/request-context.interface'
import { ensurePasswordPolicy, hashPassword, normalizeEmail } from '../common/utils/password.util'
import { authConfig } from '../config/auth.config'
import { ConfigType } from '@nestjs/config'
import { Inject } from '@nestjs/common'
import { ProvidersRepository } from './providers.repository'
import {
  AddVendorAreaDto,
  AddVendorSkillDto,
  CreateVendorDto,
  UpdateOwnVendorProfileDto,
  UpdateVendorDto,
} from './dto/providers.dto'

@Injectable()
export class ProvidersService {
  constructor(
    private readonly providersRepository: ProvidersRepository,
    private readonly auditService: AuditService,
    @Inject(authConfig.KEY)
    private readonly authSettings: ConfigType<typeof authConfig>,
  ) {}

  async getVendorProfile(userId: string) {
    const vendor = await this.providersRepository.getVendorByUserId(userId)

    if (!vendor) {
      throw new AppException(
        'VENDOR_PROFILE_NOT_FOUND',
        'Vendor profile not found.',
        HttpStatus.NOT_FOUND,
      )
    }

    return this.serializeVendor(vendor)
  }

  async updateVendorProfile(userId: string, payload: UpdateOwnVendorProfileDto) {
    const before = await this.providersRepository.getVendorByUserId(userId)

    if (!before) {
      throw new AppException(
        'VENDOR_PROFILE_NOT_FOUND',
        'Vendor profile not found.',
        HttpStatus.NOT_FOUND,
      )
    }

    const updated = await this.providersRepository.updateVendorSelf(userId, {
      name: payload.name?.trim() ?? before.user.name,
      phone: payload.phone?.trim() ?? before.user.phone,
    })

    if (!updated) {
      throw new AppException(
        'VENDOR_PROFILE_NOT_FOUND',
        'Vendor profile not found.',
        HttpStatus.NOT_FOUND,
      )
    }

    await this.auditService.log({
      actorType: AuditActorType.VENDOR,
      actorUserId: userId,
      action: 'UPDATE_VENDOR_PROFILE',
      entityType: 'VendorProfile',
      entityId: updated.id,
      before: this.serializeVendor(before),
      after: this.serializeVendor(updated),
    })

    return this.serializeVendor(updated)
  }

  listVendors() {
    return this.providersRepository
      .listVendors()
      .then((vendors) => vendors.map((vendor) => this.serializeVendor(vendor)))
  }

  async getVendor(id: string) {
    return this.serializeVendor(await this.providersRepository.getVendorById(id))
  }

  async createVendor(payload: CreateVendorDto, admin: AuthenticatedAdminUser) {
    if (!payload.userId && (!payload.email || !payload.password || !payload.name)) {
      throw new AppException(
        'VENDOR_CREATE_FIELDS_REQUIRED',
        'email, password and name are required when userId is not provided.',
      )
    }

    const passwordHash = payload.password ? await hashPassword(payload.password) : undefined

    if (payload.password) {
      ensurePasswordPolicy(payload.password, this.authSettings.passwordMinLength)
    }

    const vendor = await this.providersRepository.createVendor({
      userId: payload.userId,
      email: payload.email ? normalizeEmail(payload.email) : undefined,
      passwordHash,
      name: payload.name?.trim(),
      phone: payload.phone?.trim() ?? null,
      kycStatus: payload.kycStatus ?? KycStatus.PENDING,
      isActive: payload.isActive ?? true,
    })

    await this.auditService.log({
      actorType: AuditActorType.ADMIN,
      actorUserId: admin.sub,
      action: 'CREATE_VENDOR',
      entityType: 'VendorProfile',
      entityId: vendor.id,
      after: this.serializeVendor(vendor),
    })

    return this.serializeVendor(vendor)
  }

  async updateVendor(id: string, payload: UpdateVendorDto, admin: AuthenticatedAdminUser) {
    const before = await this.providersRepository.getVendorById(id)
    const updated = await this.providersRepository.updateVendor(id, {
      name: payload.name?.trim(),
      phone: payload.phone?.trim(),
      kycStatus: payload.kycStatus,
      isActive: payload.isActive,
    })

    await this.auditService.log({
      actorType: AuditActorType.ADMIN,
      actorUserId: admin.sub,
      action: 'UPDATE_VENDOR',
      entityType: 'VendorProfile',
      entityId: id,
      before: this.serializeVendor(before),
      after: this.serializeVendor(updated),
    })

    return this.serializeVendor(updated)
  }

  async deleteVendor(id: string, admin: AuthenticatedAdminUser) {
    const before = await this.providersRepository.getVendorById(id)
    const deleted = await this.providersRepository.deactivateVendor(id)

    await this.auditService.log({
      actorType: AuditActorType.ADMIN,
      actorUserId: admin.sub,
      action: 'DELETE_VENDOR',
      entityType: 'VendorProfile',
      entityId: id,
      before: this.serializeVendor(before),
      after: this.serializeVendor(deleted),
    })

    return this.serializeVendor(deleted)
  }

  async addVendorArea(id: string, payload: AddVendorAreaDto, admin: AuthenticatedAdminUser) {
    const area = await this.providersRepository.addVendorArea(id, {
      cityId: payload.cityId,
      pincode: payload.pincode.trim(),
      areaName: payload.areaName?.trim() ?? null,
    })

    await this.auditService.log({
      actorType: AuditActorType.ADMIN,
      actorUserId: admin.sub,
      action: 'ADD_VENDOR_AREA',
      entityType: 'VendorServiceArea',
      entityId: area.id,
      after: area,
    })

    return area
  }

  async addVendorSkill(id: string, payload: AddVendorSkillDto, admin: AuthenticatedAdminUser) {
    const skill = await this.providersRepository.addVendorSkill(id, {
      subServiceId: payload.subServiceId,
      isActive: payload.isActive ?? true,
    })

    await this.auditService.log({
      actorType: AuditActorType.ADMIN,
      actorUserId: admin.sub,
      action: 'ADD_VENDOR_SKILL',
      entityType: 'VendorSkill',
      entityId: skill.id,
      after: skill,
    })

    return skill
  }

  listJobsPlaceholder() {
    return {
      items: [],
      message: 'Vendor job APIs are reserved for Phase-2.',
    }
  }

  private serializeVendor(vendor: Awaited<ReturnType<ProvidersRepository['getVendorById']>>) {
    return {
      id: vendor.id,
      userId: vendor.userId,
      email: vendor.user.email,
      name: vendor.user.name,
      phone: vendor.user.phone,
      kycStatus: vendor.kycStatus,
      isActive: vendor.isActive,
      roles: vendor.user.roles.map((role) => role.role),
      serviceAreas: vendor.serviceAreas.map((area) => ({
        id: area.id,
        pincode: area.pincode,
        areaName: area.areaName,
        cityName: area.city.name,
        citySlug: area.city.slug,
      })),
      skills: vendor.skills.map((skill) => ({
        id: skill.id,
        isActive: skill.isActive,
        subServiceName: skill.subService.name,
        subServiceSlug: skill.subService.slug,
        categoryName: skill.subService.category.name,
      })),
    }
  }
}
