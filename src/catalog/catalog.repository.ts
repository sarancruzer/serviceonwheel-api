import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

const citySummarySelect = {
  id: true,
  isActive: true,
  name: true,
  slug: true,
} satisfies Prisma.CitySelect

const categorySummarySelect = {
  iconKey: true,
  id: true,
  isActive: true,
  name: true,
  slug: true,
} satisfies Prisma.CategorySelect

const subCategorySummarySelect = {
  categoryId: true,
  description: true,
  id: true,
  isActive: true,
  name: true,
  slug: true,
  sortOrder: true,
} satisfies Prisma.SubCategorySelect

const serviceSummarySelect = {
  description: true,
  id: true,
  isActive: true,
  name: true,
  priceText: true,
  priceType: true,
  priceValue: true,
  slug: true,
  sortOrder: true,
  subCategoryId: true,
} satisfies Prisma.ServiceSelect

const subServiceSummarySelect = {
  categoryId: true,
  id: true,
  isActive: true,
  name: true,
  seoDescription: true,
  seoTitle: true,
  slug: true,
} satisfies Prisma.SubServiceSelect

const subServiceSearchSelect = {
  ...subServiceSummarySelect,
  category: {
    select: {
      name: true,
      slug: true,
    },
  },
} satisfies Prisma.SubServiceSelect

@Injectable()
export class CatalogRepository {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeSearchSlug(value?: string) {
    return value
      ?.trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  listCities() {
    return this.prisma.city.findMany({
      orderBy: { name: 'asc' },
      select: citySummarySelect,
    })
  }

  listPublicCities() {
    return this.prisma.city.findMany({
      where: {
        isActive: true,
        pricingRules: {
          some: {
            isActive: true,
            subService: {
              isActive: true,
              category: {
                isActive: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
      select: citySummarySelect,
    })
  }

  listPublicSearchCategories(citySlug: string, query?: string, take?: number) {
    const normalizedQuery = query?.trim()
    const normalizedSlugQuery = this.normalizeSearchSlug(query)

    return this.prisma.category.findMany({
      where: {
        isActive: true,
        subServices: {
          some: {
            isActive: true,
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
        },
        ...(normalizedQuery
          ? {
              OR: [
                {
                  name: {
                    contains: normalizedQuery,
                    mode: 'insensitive',
                  },
                },
                ...(normalizedSlugQuery
                  ? [
                      {
                        slug: {
                          contains: normalizedSlugQuery,
                          mode: 'insensitive' as const,
                        },
                      },
                    ]
                  : []),
              ],
            }
          : {}),
      },
      orderBy: { name: 'asc' },
      select: categorySummarySelect,
      ...(take ? { take } : {}),
    })
  }

  listPublicSearchSubServices(citySlug: string, query?: string, take?: number) {
    const normalizedQuery = query?.trim()
    const normalizedSlugQuery = this.normalizeSearchSlug(query)

    return this.prisma.subService.findMany({
      where: {
        isActive: true,
        category: {
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
        ...(normalizedQuery
          ? {
              OR: [
                {
                  name: {
                    contains: normalizedQuery,
                    mode: 'insensitive',
                  },
                },
                ...(normalizedSlugQuery
                  ? [
                      {
                        slug: {
                          contains: normalizedSlugQuery,
                          mode: 'insensitive' as const,
                        },
                      },
                    ]
                  : []),
                {
                  seoTitle: {
                    contains: normalizedQuery,
                    mode: 'insensitive',
                  },
                },
                {
                  seoDescription: {
                    contains: normalizedQuery,
                    mode: 'insensitive',
                  },
                },
                {
                  category: {
                    name: {
                      contains: normalizedQuery,
                      mode: 'insensitive',
                    },
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
      select: subServiceSearchSelect,
      ...(take ? { take } : {}),
    })
  }

  createCity(data: Prisma.CityCreateInput) {
    return this.prisma.city.create({ data })
  }

  getCity(id: string) {
    return this.prisma.city.findUniqueOrThrow({ where: { id } })
  }

  getCityBySlug(slug: string) {
    return this.prisma.city.findUniqueOrThrow({ where: { slug } })
  }

  updateCity(id: string, data: Prisma.CityUpdateInput) {
    return this.prisma.city.update({
      where: { id },
      data,
    })
  }

  softDeleteCity(id: string) {
    return this.prisma.city.update({
      where: { id },
      data: { isActive: false },
    })
  }

  listCategories() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    })
  }

  listImportedCategories() {
    return this.prisma.category.findMany({
      where: {
        isActive: true,
        subCategories: {
          some: {
            isActive: true,
            services: {
              some: {
                isActive: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
      select: categorySummarySelect,
    })
  }

  listImportedSubCategories(categoryId: string) {
    return this.prisma.subCategory.findMany({
      where: {
        categoryId,
        isActive: true,
        category: {
          isActive: true,
        },
        services: {
          some: {
            isActive: true,
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: subCategorySummarySelect,
    })
  }

  listImportedServices(subCategoryId: string) {
    return this.prisma.service.findMany({
      where: {
        isActive: true,
        subCategoryId,
        subCategory: {
          isActive: true,
          category: {
            isActive: true,
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: serviceSummarySelect,
    })
  }

  createCategory(data: Prisma.CategoryCreateInput) {
    return this.prisma.category.create({ data })
  }

  getCategory(id: string) {
    return this.prisma.category.findUniqueOrThrow({ where: { id } })
  }

  getCategoryBySlug(slug: string) {
    return this.prisma.category.findUniqueOrThrow({ where: { slug } })
  }

  updateCategory(id: string, data: Prisma.CategoryUpdateInput) {
    return this.prisma.category.update({
      where: { id },
      data,
    })
  }

  softDeleteCategory(id: string) {
    return this.prisma.category.update({
      where: { id },
      data: { isActive: false },
    })
  }

  listSubServices() {
    return this.prisma.subService.findMany({
      orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
      include: {
        category: true,
      },
    })
  }

  createSubService(data: Prisma.SubServiceCreateInput) {
    return this.prisma.subService.create({
      data,
      include: {
        category: true,
      },
    })
  }

  getSubService(id: string) {
    return this.prisma.subService.findUniqueOrThrow({
      where: { id },
      include: {
        category: true,
      },
    })
  }

  getSubServiceBySlug(categorySlug: string, subServiceSlug: string) {
    return this.prisma.subService.findFirstOrThrow({
      where: {
        slug: subServiceSlug,
        category: {
          slug: categorySlug,
        },
      },
      include: {
        category: true,
      },
    })
  }

  updateSubService(id: string, data: Prisma.SubServiceUpdateInput) {
    return this.prisma.subService.update({
      where: { id },
      data,
      include: {
        category: true,
      },
    })
  }

  softDeleteSubService(id: string) {
    return this.prisma.subService.update({
      where: { id },
      data: { isActive: false },
      include: {
        category: true,
      },
    })
  }

  listPricingRules() {
    return this.prisma.pricingRule.findMany({
      include: {
        city: true,
        subService: {
          include: {
            category: true,
          },
        },
      },
      orderBy: [{ city: { name: 'asc' } }, { subService: { name: 'asc' } }],
    })
  }

  createPricingRule(data: Prisma.PricingRuleCreateInput) {
    return this.prisma.pricingRule.create({
      data,
      include: {
        city: true,
        subService: {
          include: {
            category: true,
          },
        },
      },
    })
  }

  getPricingRule(id: string) {
    return this.prisma.pricingRule.findUniqueOrThrow({
      where: { id },
      include: {
        city: true,
        subService: {
          include: {
            category: true,
          },
        },
      },
    })
  }

  updatePricingRule(id: string, data: Prisma.PricingRuleUpdateInput) {
    return this.prisma.pricingRule.update({
      where: { id },
      data,
      include: {
        city: true,
        subService: {
          include: {
            category: true,
          },
        },
      },
    })
  }

  softDeletePricingRule(id: string) {
    return this.prisma.pricingRule.update({
      where: { id },
      data: { isActive: false },
      include: {
        city: true,
        subService: {
          include: {
            category: true,
          },
        },
      },
    })
  }

  listFaqs() {
    return this.prisma.faq.findMany({
      orderBy: [{ scopeType: 'asc' }, { sortOrder: 'asc' }],
    })
  }

  createFaq(data: Prisma.FaqCreateInput) {
    return this.prisma.faq.create({ data })
  }

  getFaq(id: string) {
    return this.prisma.faq.findUniqueOrThrow({ where: { id } })
  }

  updateFaq(id: string, data: Prisma.FaqUpdateInput) {
    return this.prisma.faq.update({
      where: { id },
      data,
    })
  }

  softDeleteFaq(id: string) {
    return this.prisma.faq.update({
      where: { id },
      data: { isActive: false },
    })
  }

  getPublicCity(citySlug: string) {
    return this.prisma.city.findFirstOrThrow({
      where: {
        slug: citySlug,
        isActive: true,
      },
      select: citySummarySelect,
    })
  }

  listPublicCategories(citySlug: string) {
    return this.prisma.category.findMany({
      where: {
        isActive: true,
        subServices: {
          some: {
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
        },
      },
      orderBy: { name: 'asc' },
      select: categorySummarySelect,
    })
  }

  listPublicSubServices(citySlug: string, categorySlug: string) {
    return this.prisma.subService.findMany({
      where: {
        category: {
          slug: categorySlug,
          isActive: true,
        },
        isActive: true,
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
      orderBy: { name: 'asc' },
      select: subServiceSummarySelect,
    })
  }

  getPublicPricingRule(citySlug: string, subServiceSlug: string) {
    return this.prisma.pricingRule.findFirstOrThrow({
      where: {
        city: {
          slug: citySlug,
          isActive: true,
        },
        subService: {
          slug: subServiceSlug,
          isActive: true,
          category: {
            isActive: true,
          },
        },
        isActive: true,
      },
      select: {
        baseLaborPrice: true,
        cityId: true,
        id: true,
        isActive: true,
        notes: true,
        priceType: true,
        subServiceId: true,
        visitFee: true,
      },
    })
  }
}
