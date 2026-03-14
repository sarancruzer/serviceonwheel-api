import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PriceType, PrismaClient } from '@prisma/client'

type CatalogImportArgs = {
  cityName?: string
  citySlug?: string
  filePath: string
  skipPricing: boolean
}

type CrawlItem = {
  description?: string | null
  name?: string | null
  priceText?: string | null
  priceType?: string | null
  priceValue?: number | null
}

type CrawlSubcategory = {
  description?: string | null
  items?: CrawlItem[]
  name?: string | null
}

type CrawlCategory = {
  categoryName?: string | null
  categoryUrl?: string | null
  intro?: string | null
  pageHeading?: string | null
  pageTitle?: string | null
  quickSubcategories?: string[]
  subcategories?: CrawlSubcategory[]
}

type CrawlPayload = {
  categories?: CrawlCategory[]
  cityPageHeading?: string | null
  citySlug?: string | null
}

type ImportedSubServiceSeed = {
  description: string | null
  items: CrawlItem[]
  name: string
}

type PricingSummary = {
  baseLaborPrice: string | null
  notes: string | null
  priceType: PriceType
  visitFee: string
}

const prisma = new PrismaClient()

const curatedSubServicesByCategorySlug: Record<string, string[]> = {
  'air-conditioner': [
    'Annual maintenance contract',
    'Repair',
    'Service',
    'Cooling problem',
    'Gas leakage problem',
    'Water leakage',
    'Installation',
    'Un-Installation',
    'Relocation',
    'Gas charging (Top Up)',
    'Remote problem',
    'Air Conditioner Purchase',
  ],
  'beauty-salon': [
    'Waxing',
    'Manicure',
    'Pedicure',
    'Bleach & Dtan',
    'facials and cleanups',
    'Classic Salon',
    'Salon prime',
    'Hair Care',
    'Other',
  ],
  refrigerator: [
    'Repair',
    'No Power',
    'light Issue',
    'Door Issue',
    'Cooling Issue',
    'Servicing cleaning (one Time)',
    'freezer Cooling Issue',
    'Installation',
    'Servicing cleaning (AMC)',
  ],
  geyser: [
    'Electric Geyser Repair',
    'Electric Geyser heating issue',
    'Electric Geyser power issue',
    'Electric Geyser Installation',
    'Electric Geyser Un-Installation',
    'Electric Geyser Shifting',
    'Gas geyser Repair',
    'Gas geyser heating issue',
    'Gas geyser sparking issue',
    'Gas geyser Shifting',
    'Gas geyser Un-Installation',
    'Gas geyser Installation',
  ],
  'washing-machine': [
    'Repair',
    'Servicing cleaning (one Time)',
    'display issue',
    'Water drain issue',
    'Tub rotation issue',
    'No Power issue',
    'Installation',
    'Button replace',
    'Servicing cleaning (AMC)',
  ],
  'microwave-oven': [
    'Repair',
    'Glass plate issue',
    'plate rotation issue',
    'Touch panel issue',
    'Spark issue',
    'Heating issue',
    'Installation',
    'Microwave cleaning',
  ],
  'kitchen-chimney': [
    'Basic wall mounted chimney',
    'Island Kitchen Chimney',
    'Other',
    'Chimney AMC',
  ],
  'tv-repair': ['Installation / Uninstallation', 'Repair'],
  plumber: [
    'Basin & sink',
    'Grouting',
    'Bath filling',
    'Drainage pipes',
    'Toilet',
    'Tap & mixer',
    'Water tank',
    'Motor',
    'Water pipe connection',
    'Water filter',
    'Repair',
    'Removal',
    'Installation',
    'Other',
    'Plumbing Hardware Supplier',
  ],
  carpenter: [
    'Glass window',
    'Cushion Work',
    'Balcony',
    'Bed',
    'Cupboard & drawer',
    'Door',
    'Drill & hang',
    'Furniture assembly',
    'Furniture repair',
    'Window & curtain',
    'Bed Repair',
    'Un-Installation/Removal',
    'Installation',
    'Hardware material supplier',
  ],
  electrician: [
    'Repair',
    'Decorative Lights',
    'Wiring',
    'Inverter and Stabilizer',
    'Appliance',
    'Door bell',
    'Electrical material supplier',
    'Installation/fitting',
    'Something else',
  ],
  'home-painter': ['Home painting', 'Society'],
  'civil-contractor': ['water proofing', 'Mason service', 'Civil material supplier'],
  'makeup-artist': [
    'Makeup & styling packages',
    'Professional makeup',
    'Everyday makeup & styling',
    'Styling',
    'Pre bridal packages',
    'Add Ons',
    'HD Makeup With Traditional Look',
    'Saree Tie With Makeup',
    'Reception Makeup',
    'Engagement Makeup',
    'Party Makeup',
    'Bridal Makeup',
    'Smokey Makeup',
    'Natural Makeup',
    'Shimmer Makeup',
    'Mineral Makeup',
    'Matte Makeup',
  ],
  'door-step-car-repair': ['Car', 'SUV', 'Regular car package', 'Premium cars'],
  'doorstep-bike-repair': [
    '110 CC 2-WHEELERS',
    '125 CC 2-WHEELERS',
    '150 CC 2-WHEELERS',
    '200 CC 2-WHEELERS',
    '350 CC 2-WHEELERS',
  ],
  'cctv-camera': [
    'CCTV & security alarm Service',
    'Installation',
    'Un-Installation',
    'Shifting',
    'Repair',
    'Annual maintenance (AMC)',
  ],
  'room-cooler': [
    'Installation',
    'Un-Installation',
    'Repair',
    'Servicing-colour,cleaning,mat change',
  ],
  'air-cooler': ['Air Cooler Ducting', 'Repair'],
  sanitization: [
    'Office (Per Feet)',
    'Gym ( Per Feet)',
    'others',
    'Home (Per Feet)',
    'Mall ( per feet)',
    'Shop (per feet)',
  ],
  'doorstep-mobile-repair': [
    'Camera repair',
    'Mobile Water damage repair',
    'Charging port repair',
    'Battery Issue',
    'Mobile Software',
    'Display Issue',
    'Speaker/Mic Issue',
  ],
  't-shirt-printing': [
    'T-shirt with company name in single colour',
    'T-shirt & Cap Printing',
    'T-shirt with multi colour',
    'T-Shirt Embroidary',
    'T-Shirt With Stiching',
    'Cap printing with company name single colour',
    'Cap with multi colour',
  ],
  'security-guard': [
    'House Security Service (PER MONTH)',
    'Bank Security Service (PER MONTH)',
    'Shop Security service (PER MONTH)',
    'Showroom Security Service (PER MONTH)',
    'Hospital security service (PER MONTH)',
    'Hotel Security service (PER MONTH)',
    'Industrial security Service(PER MONTH )',
    'Event Security Service',
    'Private security Service (PER MONTH)',
    'Gate keeping Service (PER MONTH)',
    'Parking Lot maintenance',
  ],
}

function normalizeText(value?: string | null) {
  return String(value ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function slugify(value: string) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeKey(value?: string | null) {
  return slugify(value ?? '')
}

function titleCase(value: string) {
  return value
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function parseArgs(argv: string[]): CatalogImportArgs {
  let cityName: string | undefined
  let citySlug: string | undefined
  let filePath: string | undefined
  let skipPricing = false

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    const nextValue = argv[index + 1]

    if (arg === '--file' && nextValue) {
      filePath = nextValue
      index += 1
      continue
    }

    if (arg === '--city-slug' && nextValue) {
      citySlug = nextValue
      index += 1
      continue
    }

    if (arg === '--city-name' && nextValue) {
      cityName = nextValue
      index += 1
      continue
    }

    if (arg === '--skip-pricing') {
      skipPricing = true
    }
  }

  if (!filePath) {
    throw new Error(
      'Missing required --file argument. Example: npm run prisma:import:catalog -- --file ../truelysell-demo/crawl-web/serviceonwheel-nagpur.json',
    )
  }

  return {
    cityName,
    citySlug,
    filePath,
    skipPricing,
  }
}

function getCategorySlug(category: CrawlCategory) {
  const url = normalizeText(category.categoryUrl)
  const urlMatch = url.match(/\/service\/([^/?#]+)\.html$/i)

  if (urlMatch?.[1]) {
    return slugify(urlMatch[1].replace(/[_-]\d+$/, ''))
  }

  return slugify(category.categoryName ?? 'service')
}

function cleanDescription(value?: string | null) {
  const text = normalizeText(value)

  if (!text) {
    return null
  }

  return text.slice(0, 600)
}

function getFallbackSubServiceName(category: CrawlCategory) {
  const heading = normalizeText(category.pageHeading)
    .replace(/\s+service in\s+.+$/i, '')
    .trim()

  return heading || normalizeText(category.categoryName) || 'General Service'
}

function buildImportedSubServices(category: CrawlCategory): ImportedSubServiceSeed[] {
  const structuredSubServices = Array.isArray(category.subcategories)
    ? category.subcategories
        .map((subcategory) => ({
          description: cleanDescription(subcategory.description),
          items: Array.isArray(subcategory.items) ? subcategory.items : [],
          name: normalizeText(subcategory.name),
        }))
        .filter((subcategory) => subcategory.name)
    : []

  const structuredByName = new Map(
    structuredSubServices.map((subcategory) => [normalizeKey(subcategory.name), subcategory]),
  )

  const categorySlug = getCategorySlug(category)
  const curatedNames = curatedSubServicesByCategorySlug[categorySlug]

  if (curatedNames?.length) {
    return curatedNames.map((name) => {
      const structuredMatch = structuredByName.get(normalizeKey(name))

      return (
        structuredMatch ?? {
          description: cleanDescription(category.intro),
          items: [],
          name,
        }
      )
    })
  }

  if (structuredSubServices.length > 0) {
    return structuredSubServices
  }

  return [
    {
      description: cleanDescription(category.intro),
      items: [],
      name: getFallbackSubServiceName(category),
    },
  ]
}

function formatPrice(value: number) {
  return value.toFixed(2)
}

function summarizeItems(items: CrawlItem[]) {
  const parts = items
    .map((item) => {
      const name = normalizeText(item.name)
      const priceText = normalizeText(item.priceText)

      if (!name) {
        return null
      }

      return priceText ? `${name}: ${priceText}` : name
    })
    .filter((value): value is string => Boolean(value))
    .slice(0, 6)

  return parts.length > 0 ? parts.join('; ') : null
}

function buildPricingSummary(
  subService: ImportedSubServiceSeed,
  category: CrawlCategory,
): PricingSummary {
  const validPrices = subService.items
    .map((item) =>
      item.priceType === 'fixed' &&
      typeof item.priceValue === 'number' &&
      Number.isFinite(item.priceValue)
        ? item.priceValue
        : null,
    )
    .filter((value): value is number => value !== null)

  const hasOnVisitItem = subService.items.some(
    (item) =>
      normalizeText(item.priceType).toLowerCase() === 'on_visit' ||
      normalizeText(item.priceText).toLowerCase() === 'on visit',
  )

  const variants = summarizeItems(subService.items)
  const noteParts = [
    'Imported from ServiceOnWheel crawl.',
    subService.description,
    variants ? `Variants: ${variants}.` : null,
    validPrices.length > 1 ? 'Stored price is the lowest listed starting price.' : null,
  ].filter((value): value is string => Boolean(value))

  if (validPrices.length > 0) {
    return {
      baseLaborPrice: formatPrice(Math.min(...validPrices)),
      notes: noteParts.join(' '),
      priceType: PriceType.FIXED,
      visitFee: '0.00',
    }
  }

  return {
    baseLaborPrice: null,
    notes:
      noteParts.join(' ') ||
      cleanDescription(category.pageTitle) ||
      `Imported ${subService.name} service.`,
    priceType: hasOnVisitItem ? PriceType.INSPECTION_QUOTE : PriceType.INSPECTION_QUOTE,
    visitFee: '0.00',
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const payload = JSON.parse(
    readFileSync(resolve(process.cwd(), args.filePath), 'utf8'),
  ) as CrawlPayload

  const citySlug = slugify(args.citySlug ?? payload.citySlug ?? '')

  if (!citySlug) {
    throw new Error('Unable to determine city slug from --city-slug or input JSON.')
  }

  const cityName = normalizeText(args.cityName) || titleCase(citySlug)
  const categories = Array.isArray(payload.categories) ? payload.categories : []

  const stats = {
    categoriesCreatedOrUpdated: 0,
    pricingRulesCreatedOrUpdated: 0,
    subServicesCreatedOrUpdated: 0,
  }

  const city = await prisma.city.upsert({
    where: { slug: citySlug },
    update: {
      isActive: true,
      name: cityName,
    },
    create: {
      isActive: true,
      name: cityName,
      slug: citySlug,
    },
  })

  for (const categoryPayload of categories) {
    const categoryName = normalizeText(categoryPayload.categoryName)

    if (!categoryName) {
      continue
    }

    const categorySlug = getCategorySlug(categoryPayload)
    const category = await prisma.category.upsert({
      where: { slug: categorySlug },
      update: {
        iconKey: `categories/${categorySlug}.svg`,
        isActive: true,
        name: categoryName,
      },
      create: {
        iconKey: `categories/${categorySlug}.svg`,
        isActive: true,
        name: categoryName,
        slug: categorySlug,
      },
    })

    stats.categoriesCreatedOrUpdated += 1

    const importedSubServices = buildImportedSubServices(categoryPayload)
    const seenNames = new Set<string>()

    for (const importedSubService of importedSubServices) {
      const serviceName = normalizeText(importedSubService.name)
      const serviceKey = normalizeKey(serviceName)

      if (!serviceName || seenNames.has(serviceKey)) {
        continue
      }

      seenNames.add(serviceKey)

      const subService = await prisma.subService.upsert({
        where: {
          categoryId_slug: {
            categoryId: category.id,
            slug: slugify(`${categorySlug}-${serviceName}`),
          },
        },
        update: {
          isActive: true,
          name: serviceName,
          seoDescription:
            importedSubService.description ??
            cleanDescription(categoryPayload.intro) ??
            cleanDescription(categoryPayload.pageTitle),
          seoTitle: `${serviceName} in ${city.name} | ${category.name}`,
        },
        create: {
          categoryId: category.id,
          isActive: true,
          name: serviceName,
          seoDescription:
            importedSubService.description ??
            cleanDescription(categoryPayload.intro) ??
            cleanDescription(categoryPayload.pageTitle),
          seoTitle: `${serviceName} in ${city.name} | ${category.name}`,
          slug: slugify(`${categorySlug}-${serviceName}`),
        },
      })

      stats.subServicesCreatedOrUpdated += 1

      if (args.skipPricing) {
        continue
      }

      const pricing = buildPricingSummary(importedSubService, categoryPayload)

      await prisma.pricingRule.upsert({
        where: {
          cityId_subServiceId: {
            cityId: city.id,
            subServiceId: subService.id,
          },
        },
        update: {
          baseLaborPrice: pricing.baseLaborPrice,
          isActive: true,
          notes: pricing.notes,
          priceType: pricing.priceType,
          visitFee: pricing.visitFee,
        },
        create: {
          baseLaborPrice: pricing.baseLaborPrice,
          cityId: city.id,
          isActive: true,
          notes: pricing.notes,
          priceType: pricing.priceType,
          subServiceId: subService.id,
          visitFee: pricing.visitFee,
        },
      })

      stats.pricingRulesCreatedOrUpdated += 1
    }
  }

  console.info(
    JSON.stringify(
      {
        city: {
          id: city.id,
          name: city.name,
          slug: city.slug,
        },
        sourceFile: resolve(process.cwd(), args.filePath),
        stats,
      },
      null,
      2,
    ),
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
