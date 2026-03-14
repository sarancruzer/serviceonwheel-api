import { randomUUID } from 'crypto'
import { Injectable } from '@nestjs/common'
import { AuditActorType } from '@prisma/client'
import { AuditService } from '../audit/audit.service'
import { CatalogRepository } from './catalog.repository'
import {
  CreateCategoryDto,
  CreateCityDto,
  CreateFaqDto,
  CreatePricingRuleDto,
  CreateSubServiceDto,
  PublicCatalogSearchResultType,
  PublicCatalogSearchType,
  PublicPricingRuleQueryDto,
  PublicServiceSearchQueryDto,
  UpdateCategoryDto,
  UpdateCityDto,
  UpdateFaqDto,
  UpdatePricingRuleDto,
  UpdateSubServiceDto,
} from './dto/catalog.dto'

const DEFAULT_PUBLIC_SEARCH_LIMIT = 8
const MAX_PUBLIC_SEARCH_FETCH_SIZE = 50
const MAX_PUBLIC_SEARCH_LIMIT = 20

type PublicSearchCategory = {
  id: string
  name: string
  slug: string
}

type PublicSearchSubService = {
  category: {
    name: string
    slug: string
  }
  id: string
  name: string
  seoDescription: string | null
  slug: string
}

function buildPublicServicesHref(citySlug: string, categorySlug: string, serviceSlug?: string) {
  const searchParams = new URLSearchParams({
    city: citySlug,
  })

  if (serviceSlug) {
    searchParams.set('service', serviceSlug)
  }

  return `/services/${categorySlug}?${searchParams.toString()}`
}

function normalizePublicSearchQuery(value?: string | null) {
  return value?.trim() ?? ''
}

function getPublicSearchScore(query: string, ...candidates: Array<string | null | undefined>) {
  const normalizedQuery = query.toLowerCase()

  return candidates.reduce((bestScore, candidate) => {
    if (!candidate) {
      return bestScore
    }

    const normalizedCandidate = candidate.toLowerCase()

    if (normalizedCandidate === normalizedQuery) {
      return Math.max(bestScore, 500)
    }

    if (normalizedCandidate.startsWith(normalizedQuery)) {
      return Math.max(bestScore, 350)
    }

    if (normalizedCandidate.includes(` ${normalizedQuery}`)) {
      return Math.max(bestScore, 250)
    }

    if (normalizedCandidate.includes(normalizedQuery)) {
      return Math.max(bestScore, 150)
    }

    return bestScore
  }, 0)
}

function createCategorySearchResult(category: PublicSearchCategory, citySlug: string) {
  return {
    categoryName: category.name,
    categorySlug: category.slug,
    citySlug,
    href: buildPublicServicesHref(citySlug, category.slug),
    id: `category-${category.id}`,
    subtitle: `${category.name} category`,
    title: category.name,
    type: PublicCatalogSearchResultType.CATEGORY,
  }
}

function createSubServiceSearchResult(subService: PublicSearchSubService, citySlug: string) {
  return {
    categoryName: subService.category.name,
    categorySlug: subService.category.slug,
    citySlug,
    href: buildPublicServicesHref(citySlug, subService.category.slug, subService.slug),
    id: `subservice-${subService.id}`,
    serviceSlug: subService.slug,
    subtitle:
      subService.seoDescription ??
      `${subService.name} in ${subService.category.name.toLowerCase()}`,
    title: subService.name,
    type: PublicCatalogSearchResultType.SUBSERVICE,
  }
}

@Injectable()
export class CatalogService {
  constructor(
    private readonly catalogRepository: CatalogRepository,
    private readonly auditService: AuditService,
  ) {}

  listCities() {
    return this.catalogRepository.listCities()
  }

  async createCity(payload: CreateCityDto, adminId: string) {
    const created = await this.catalogRepository.createCity({
      name: payload.name.trim(),
      slug: payload.slug.trim(),
      isActive: payload.isActive ?? true,
    })

    await this.auditService.log({
      actorType: AuditActorType.ADMIN,
      actorUserId: adminId,
      action: 'CREATE_CITY',
      entityType: 'City',
      entityId: created.id,
      after: created,
    })

    return created
  }

  getCity(id: string) {
    return this.catalogRepository.getCity(id)
  }

  async updateCity(id: string, payload: UpdateCityDto, adminId: string) {
    const before = await this.catalogRepository.getCity(id)
    const updated = await this.catalogRepository.updateCity(id, {
      name: payload.name?.trim(),
      slug: payload.slug?.trim(),
      isActive: payload.isActive,
    })

    await this.auditService.log({
      actorType: AuditActorType.ADMIN,
      actorUserId: adminId,
      action: 'UPDATE_CITY',
      entityType: 'City',
      entityId: id,
      before,
      after: updated,
    })

    return updated
  }

  async deleteCity(id: string, adminId: string) {
    const before = await this.catalogRepository.getCity(id)
    const deleted = await this.catalogRepository.softDeleteCity(id)

    await this.auditService.log({
      actorType: AuditActorType.ADMIN,
      actorUserId: adminId,
      action: 'DELETE_CITY',
      entityType: 'City',
      entityId: id,
      before,
      after: deleted,
    })

    return deleted
  }

  listCategories() {
    return this.catalogRepository.listCategories()
  }

  listImportedCategories() {
    return this.catalogRepository.listImportedCategories()
  }

  listImportedSubCategories(categoryId: string) {
    return this.catalogRepository.listImportedSubCategories(categoryId)
  }

  listImportedServices(subCategoryId: string) {
    return this.catalogRepository.listImportedServices(subCategoryId)
  }

  async createCategory(payload: CreateCategoryDto, adminId: string) {
    const created = await this.catalogRepository.createCategory({
      name: payload.name.trim(),
      slug: payload.slug.trim(),
      iconKey: payload.iconKey?.trim() ?? null,
      isActive: payload.isActive ?? true,
    })

    await this.auditService.log({
      actorType: AuditActorType.ADMIN,
      actorUserId: adminId,
      action: 'CREATE_CATEGORY',
      entityType: 'Category',
      entityId: created.id,
      after: created,
    })

    return created
  }

  getCategory(id: string) {
    return this.catalogRepository.getCategory(id)
  }

  async updateCategory(id: string, payload: UpdateCategoryDto, adminId: string) {
    const before = await this.catalogRepository.getCategory(id)
    const updated = await this.catalogRepository.updateCategory(id, {
      name: payload.name?.trim(),
      slug: payload.slug?.trim(),
      iconKey: payload.iconKey?.trim(),
      isActive: payload.isActive,
    })

    await this.auditService.log({
      actorType: AuditActorType.ADMIN,
      actorUserId: adminId,
      action: 'UPDATE_CATEGORY',
      entityType: 'Category',
      entityId: id,
      before,
      after: updated,
    })

    return updated
  }

  async deleteCategory(id: string, adminId: string) {
    const before = await this.catalogRepository.getCategory(id)
    const deleted = await this.catalogRepository.softDeleteCategory(id)

    await this.auditService.log({
      actorType: AuditActorType.ADMIN,
      actorUserId: adminId,
      action: 'DELETE_CATEGORY',
      entityType: 'Category',
      entityId: id,
      before,
      after: deleted,
    })

    return deleted
  }

  listSubServices() {
    return this.catalogRepository.listSubServices()
  }

  async createSubService(payload: CreateSubServiceDto, adminId: string) {
    const created = await this.catalogRepository.createSubService({
      name: payload.name.trim(),
      slug: payload.slug.trim(),
      isActive: payload.isActive ?? true,
      seoTitle: payload.seoTitle?.trim() ?? null,
      seoDescription: payload.seoDescription?.trim() ?? null,
      category: {
        connect: { id: payload.categoryId },
      },
    })

    await this.auditService.log({
      actorType: AuditActorType.ADMIN,
      actorUserId: adminId,
      action: 'CREATE_SUBSERVICE',
      entityType: 'SubService',
      entityId: created.id,
      after: created,
    })

    return created
  }

  getSubService(id: string) {
    return this.catalogRepository.getSubService(id)
  }

  async updateSubService(id: string, payload: UpdateSubServiceDto, adminId: string) {
    const before = await this.catalogRepository.getSubService(id)
    const updated = await this.catalogRepository.updateSubService(id, {
      ...(payload.categoryId
        ? {
            category: {
              connect: { id: payload.categoryId },
            },
          }
        : {}),
      name: payload.name?.trim(),
      slug: payload.slug?.trim(),
      isActive: payload.isActive,
      seoTitle: payload.seoTitle?.trim(),
      seoDescription: payload.seoDescription?.trim(),
    })

    await this.auditService.log({
      actorType: AuditActorType.ADMIN,
      actorUserId: adminId,
      action: 'UPDATE_SUBSERVICE',
      entityType: 'SubService',
      entityId: id,
      before,
      after: updated,
    })

    return updated
  }

  async deleteSubService(id: string, adminId: string) {
    const before = await this.catalogRepository.getSubService(id)
    const deleted = await this.catalogRepository.softDeleteSubService(id)

    await this.auditService.log({
      actorType: AuditActorType.ADMIN,
      actorUserId: adminId,
      action: 'DELETE_SUBSERVICE',
      entityType: 'SubService',
      entityId: id,
      before,
      after: deleted,
    })

    return deleted
  }

  listPricingRules() {
    return this.catalogRepository.listPricingRules()
  }

  async createPricingRule(payload: CreatePricingRuleDto, adminId: string) {
    const created = await this.catalogRepository.createPricingRule({
      visitFee: payload.visitFee,
      priceType: payload.priceType,
      baseLaborPrice: payload.baseLaborPrice ?? null,
      notes: payload.notes?.trim() ?? null,
      isActive: payload.isActive ?? true,
      city: {
        connect: { id: payload.cityId },
      },
      subService: {
        connect: { id: payload.subServiceId },
      },
    })

    await this.auditService.log({
      actorType: AuditActorType.ADMIN,
      actorUserId: adminId,
      action: 'CREATE_PRICING_RULE',
      entityType: 'PricingRule',
      entityId: created.id,
      after: created,
    })

    return created
  }

  getPricingRule(id: string) {
    return this.catalogRepository.getPricingRule(id)
  }

  async updatePricingRule(id: string, payload: UpdatePricingRuleDto, adminId: string) {
    const before = await this.catalogRepository.getPricingRule(id)
    const updated = await this.catalogRepository.updatePricingRule(id, {
      ...(payload.cityId
        ? {
            city: {
              connect: { id: payload.cityId },
            },
          }
        : {}),
      ...(payload.subServiceId
        ? {
            subService: {
              connect: { id: payload.subServiceId },
            },
          }
        : {}),
      visitFee: payload.visitFee,
      priceType: payload.priceType,
      baseLaborPrice: payload.baseLaborPrice,
      notes: payload.notes?.trim(),
      isActive: payload.isActive,
    })

    await this.auditService.log({
      actorType: AuditActorType.ADMIN,
      actorUserId: adminId,
      action: 'UPDATE_PRICING_RULE',
      entityType: 'PricingRule',
      entityId: id,
      before,
      after: updated,
    })

    return updated
  }

  async deletePricingRule(id: string, adminId: string) {
    const before = await this.catalogRepository.getPricingRule(id)
    const deleted = await this.catalogRepository.softDeletePricingRule(id)

    await this.auditService.log({
      actorType: AuditActorType.ADMIN,
      actorUserId: adminId,
      action: 'DELETE_PRICING_RULE',
      entityType: 'PricingRule',
      entityId: id,
      before,
      after: deleted,
    })

    return deleted
  }

  listFaqs() {
    return this.catalogRepository.listFaqs()
  }

  async createFaq(payload: CreateFaqDto, adminId: string) {
    const created = await this.catalogRepository.createFaq({
      id: randomUUID(),
      scopeType: payload.scopeType,
      scopeId: payload.scopeId,
      question: payload.question.trim(),
      answer: payload.answer.trim(),
      sortOrder: payload.sortOrder ?? 0,
      isActive: payload.isActive ?? true,
    })

    await this.auditService.log({
      actorType: AuditActorType.ADMIN,
      actorUserId: adminId,
      action: 'CREATE_FAQ',
      entityType: 'FAQ',
      entityId: created.id,
      after: created,
    })

    return created
  }

  getFaq(id: string) {
    return this.catalogRepository.getFaq(id)
  }

  async updateFaq(id: string, payload: UpdateFaqDto, adminId: string) {
    const before = await this.catalogRepository.getFaq(id)
    const updated = await this.catalogRepository.updateFaq(id, {
      scopeType: payload.scopeType,
      scopeId: payload.scopeId,
      question: payload.question?.trim(),
      answer: payload.answer?.trim(),
      sortOrder: payload.sortOrder,
      isActive: payload.isActive,
    })

    await this.auditService.log({
      actorType: AuditActorType.ADMIN,
      actorUserId: adminId,
      action: 'UPDATE_FAQ',
      entityType: 'FAQ',
      entityId: id,
      before,
      after: updated,
    })

    return updated
  }

  async deleteFaq(id: string, adminId: string) {
    const before = await this.catalogRepository.getFaq(id)
    const deleted = await this.catalogRepository.softDeleteFaq(id)

    await this.auditService.log({
      actorType: AuditActorType.ADMIN,
      actorUserId: adminId,
      action: 'DELETE_FAQ',
      entityType: 'FAQ',
      entityId: id,
      before,
      after: deleted,
    })

    return deleted
  }

  listPublicCities() {
    return this.catalogRepository.listPublicCities()
  }

  getPublicCity(citySlug: string) {
    return this.catalogRepository.getPublicCity(citySlug)
  }

  listPublicCategories(citySlug: string) {
    return this.catalogRepository.listPublicCategories(citySlug)
  }

  listPublicSubServices(citySlug: string, categorySlug: string) {
    return this.catalogRepository.listPublicSubServices(citySlug, categorySlug)
  }

  async searchPublicServices(query: PublicServiceSearchQueryDto) {
    const normalizedCitySlug = query.citySlug.trim()
    const normalizedQuery = normalizePublicSearchQuery(query.q)
    const safeLimit = Math.min(
      Math.max(query.limit ?? DEFAULT_PUBLIC_SEARCH_LIMIT, 1),
      MAX_PUBLIC_SEARCH_LIMIT,
    )
    const searchType = query.type ?? PublicCatalogSearchType.ALL

    if (!normalizedQuery) {
      if (searchType === PublicCatalogSearchType.CATEGORY) {
        const categories = await this.catalogRepository.listPublicSearchCategories(
          normalizedCitySlug,
          undefined,
          safeLimit,
        )
        const items = categories.map((category) =>
          createCategorySearchResult(category, normalizedCitySlug),
        )

        return {
          citySlug: normalizedCitySlug,
          items,
          query: normalizedQuery,
          total: items.length,
        }
      }

      if (searchType === PublicCatalogSearchType.SUBSERVICE) {
        const subServices = await this.catalogRepository.listPublicSearchSubServices(
          normalizedCitySlug,
          undefined,
          safeLimit,
        )
        const items = subServices.map((subService) =>
          createSubServiceSearchResult(subService, normalizedCitySlug),
        )

        return {
          citySlug: normalizedCitySlug,
          items,
          query: normalizedQuery,
          total: items.length,
        }
      }

      const [subServices, categories] = await Promise.all([
        this.catalogRepository.listPublicSearchSubServices(
          normalizedCitySlug,
          undefined,
          safeLimit,
        ),
        this.catalogRepository.listPublicSearchCategories(normalizedCitySlug, undefined, safeLimit),
      ])

      const items = [
        ...subServices.map((subService) =>
          createSubServiceSearchResult(subService, normalizedCitySlug),
        ),
        ...categories.map((category) => createCategorySearchResult(category, normalizedCitySlug)),
      ].slice(0, safeLimit)

      return {
        citySlug: normalizedCitySlug,
        items,
        query: normalizedQuery,
        total: items.length,
      }
    }

    const fetchLimit = Math.min(safeLimit * 5, MAX_PUBLIC_SEARCH_FETCH_SIZE)
    const [categories, subServices] = await Promise.all([
      searchType === PublicCatalogSearchType.SUBSERVICE
        ? Promise.resolve([] as PublicSearchCategory[])
        : this.catalogRepository.listPublicSearchCategories(
            normalizedCitySlug,
            normalizedQuery,
            fetchLimit,
          ),
      searchType === PublicCatalogSearchType.CATEGORY
        ? Promise.resolve([] as PublicSearchSubService[])
        : this.catalogRepository.listPublicSearchSubServices(
            normalizedCitySlug,
            normalizedQuery,
            fetchLimit,
          ),
    ])

    const categoryMatches = categories
      .map((category) => ({
        item: createCategorySearchResult(category, normalizedCitySlug),
        score: getPublicSearchScore(normalizedQuery, category.name, category.slug),
      }))
      .filter((match) => match.score > 0)

    const subServiceMatches = subServices
      .map((subService) => ({
        item: createSubServiceSearchResult(subService, normalizedCitySlug),
        score: getPublicSearchScore(
          normalizedQuery,
          subService.name,
          subService.slug,
          subService.category.name,
          subService.seoDescription,
        ),
      }))
      .filter((match) => match.score > 0)

    const items = [...categoryMatches, ...subServiceMatches]
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score
        }

        if (left.item.type !== right.item.type) {
          return left.item.type === PublicCatalogSearchResultType.SUBSERVICE ? -1 : 1
        }

        return left.item.title.localeCompare(right.item.title)
      })
      .slice(0, safeLimit)
      .map((match) => match.item)

    return {
      citySlug: normalizedCitySlug,
      items,
      query: normalizedQuery,
      total: items.length,
    }
  }

  getPublicPricingRule(query: PublicPricingRuleQueryDto) {
    return this.catalogRepository.getPublicPricingRule(query.citySlug, query.subServiceSlug)
  }
}
