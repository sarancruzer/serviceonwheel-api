import { PrismaClient, PriceType, Role, KycStatus, FaqScopeType } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const categories = [
  {
    name: 'Electrician',
    slug: 'electrician',
    iconKey: 'catalog/electrician.svg',
    subServices: [
      'Fan Installation',
      'Switch Board Repair',
      'Wiring Repair',
      'Door Bell Installation',
      'MCB Replacement',
      'Inverter Wiring',
      'Light Installation',
      'Socket Repair',
      'Exhaust Fan Installation',
      'Power Failure Diagnosis',
      'Geyser Wiring',
      'Earth Leakage Check',
    ],
  },
  {
    name: 'Plumber',
    slug: 'plumber',
    iconKey: 'catalog/plumber.svg',
    subServices: [
      'Tap Repair',
      'Leakage Fix',
      'Motor Installation',
      'Pipe Replacement',
      'Bathroom Fittings',
      'Kitchen Sink Block',
      'Flush Tank Repair',
      'Water Heater Connection',
      'Overhead Tank Pipe Work',
      'Drain Cleaning',
      'Water Pressure Check',
      'Toilet Seat Installation',
    ],
  },
  {
    name: 'Carpenter',
    slug: 'carpenter',
    iconKey: 'catalog/carpenter.svg',
    subServices: [
      'Door Alignment',
      'Cupboard Hinge Fix',
      'Window Lock Repair',
      'Furniture Assembly',
      'Wall Shelf Installation',
      'Wooden Cot Repair',
      'Modular Cabinet Adjustment',
      'Curtain Rod Fixing',
      'Drawer Channel Replacement',
      'Wood Polish Touchup',
      'Dining Table Repair',
      'Custom Minor Fabrication',
    ],
  },
]

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function ensureUser(params: {
  email: string
  password: string
  name: string
  phone?: string
  roles: Role[]
  vendor?: boolean
}) {
  const email = params.email.toLowerCase()
  const passwordHash = await bcrypt.hash(params.password, 10)

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: params.name,
      phone: params.phone ?? null,
      passwordHash,
      isActive: true,
    },
    create: {
      email,
      passwordHash,
      name: params.name,
      phone: params.phone ?? null,
      roles: {
        create: params.roles.map((role) => ({ role })),
      },
    },
    include: {
      roles: true,
    },
  })

  const missingRoles = params.roles.filter(
    (role) => !user.roles.some((existingRole) => existingRole.role === role),
  )

  if (missingRoles.length > 0) {
    await prisma.userRole.createMany({
      data: missingRoles.map((role) => ({ userId: user.id, role })),
      skipDuplicates: true,
    })
  }

  if (params.vendor) {
    await prisma.vendorProfile.upsert({
      where: { userId: user.id },
      update: {
        kycStatus: KycStatus.VERIFIED,
        isActive: true,
      },
      create: {
        userId: user.id,
        kycStatus: KycStatus.VERIFIED,
        isActive: true,
      },
    })
  }

  return prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    include: {
      vendorProfile: true,
      roles: true,
    },
  })
}

async function upsertFaq(params: {
  scopeType: FaqScopeType
  scopeId: string
  question: string
  answer: string
  sortOrder: number
}) {
  const existing = await prisma.fAQ.findFirst({
    where: {
      scopeType: params.scopeType,
      scopeId: params.scopeId,
      question: params.question,
    },
  })

  if (existing) {
    return prisma.fAQ.update({
      where: { id: existing.id },
      data: {
        answer: params.answer,
        sortOrder: params.sortOrder,
        isActive: true,
      },
    })
  }

  return prisma.fAQ.create({
    data: {
      scopeType: params.scopeType,
      scopeId: params.scopeId,
      question: params.question,
      answer: params.answer,
      sortOrder: params.sortOrder,
      isActive: true,
    },
  })
}

async function main() {
  const thanjavur = await prisma.city.upsert({
    where: { slug: 'thanjavur' },
    update: { name: 'Thanjavur', isActive: true },
    create: {
      name: 'Thanjavur',
      slug: 'thanjavur',
      isActive: true,
    },
  })

  for (const categorySeed of categories) {
    const category = await prisma.category.upsert({
      where: { slug: categorySeed.slug },
      update: {
        name: categorySeed.name,
        iconKey: categorySeed.iconKey,
        isActive: true,
      },
      create: {
        name: categorySeed.name,
        slug: categorySeed.slug,
        iconKey: categorySeed.iconKey,
        isActive: true,
      },
    })

    for (const [index, subServiceName] of categorySeed.subServices.entries()) {
      const subService = await prisma.subService.upsert({
        where: {
          categoryId_slug: {
            categoryId: category.id,
            slug: slugify(subServiceName),
          },
        },
        update: {
          name: subServiceName,
          isActive: true,
          seoTitle: `${subServiceName} in Thanjavur | ${categorySeed.name}`,
          seoDescription: `Book ${subServiceName.toLowerCase()} experts in Thanjavur through ServiceOnWheel.`,
        },
        create: {
          categoryId: category.id,
          name: subServiceName,
          slug: slugify(subServiceName),
          isActive: true,
          seoTitle: `${subServiceName} in Thanjavur | ${categorySeed.name}`,
          seoDescription: `Book ${subServiceName.toLowerCase()} experts in Thanjavur through ServiceOnWheel.`,
        },
      })

      await prisma.pricingRule.upsert({
        where: {
          cityId_subServiceId: {
            cityId: thanjavur.id,
            subServiceId: subService.id,
          },
        },
        update: {
          visitFee: '149.00',
          priceType: index % 3 === 0 ? PriceType.INSPECTION_QUOTE : PriceType.FIXED,
          baseLaborPrice: index % 3 === 0 ? null : '299.00',
          notes: 'Phase-1 launch template pricing. Final price may vary based on site condition.',
          isActive: true,
        },
        create: {
          cityId: thanjavur.id,
          subServiceId: subService.id,
          visitFee: '149.00',
          priceType: index % 3 === 0 ? PriceType.INSPECTION_QUOTE : PriceType.FIXED,
          baseLaborPrice: index % 3 === 0 ? null : '299.00',
          notes: 'Phase-1 launch template pricing. Final price may vary based on site condition.',
          isActive: true,
        },
      })
    }

    await upsertFaq({
      scopeType: FaqScopeType.CATEGORY,
      scopeId: category.id,
      question: `Do you provide verified ${categorySeed.name.toLowerCase()} professionals in Thanjavur?`,
      answer: 'Yes. Every provider added to the platform is manually verified before assignment.',
      sortOrder: 1,
    })
    await upsertFaq({
      scopeType: FaqScopeType.CATEGORY,
      scopeId: category.id,
      question: `How is ${categorySeed.name.toLowerCase()} pricing determined?`,
      answer:
        'Visit fee and estimated labor are shown upfront. Final labor is confirmed after on-site work assessment when applicable.',
      sortOrder: 2,
    })
  }

  await upsertFaq({
    scopeType: FaqScopeType.CITY,
    scopeId: thanjavur.id,
    question: 'Which areas of Thanjavur are currently covered?',
    answer:
      'Phase-1 covers Thanjavur city and selected nearby pincodes. The coverage model supports expansion to multiple cities.',
    sortOrder: 1,
  })
  await upsertFaq({
    scopeType: FaqScopeType.CITY,
    scopeId: thanjavur.id,
    question: 'How do payments work in Phase-1?',
    answer:
      'Customers pay vendors directly through cash or UPI. The platform settles weekly commissions with vendors separately.',
    sortOrder: 2,
  })

  const admin = await ensureUser({
    email: process.env.ADMIN_SEED_EMAIL ?? 'admin@serviceonwheel.local',
    password: process.env.ADMIN_SEED_PASSWORD ?? 'Admin@12345',
    name: process.env.ADMIN_SEED_NAME ?? 'Platform Admin',
    roles: [Role.ADMIN],
  })

  const demoCustomer = await ensureUser({
    email: process.env.DEMO_CUSTOMER_EMAIL ?? 'customer@serviceonwheel.local',
    password: process.env.DEMO_CUSTOMER_PASSWORD ?? 'Customer@123',
    name: process.env.DEMO_CUSTOMER_NAME ?? 'Demo Customer',
    phone: '+919900000001',
    roles: [Role.CUSTOMER],
  })

  const demoVendor = await ensureUser({
    email: process.env.DEMO_VENDOR_EMAIL ?? 'vendor@serviceonwheel.local',
    password: process.env.DEMO_VENDOR_PASSWORD ?? 'Vendor@123',
    name: process.env.DEMO_VENDOR_NAME ?? 'Demo Vendor',
    phone: '+919900000020',
    roles: [Role.CUSTOMER, Role.VENDOR],
    vendor: true,
  })

  if (demoVendor.vendorProfile) {
    await prisma.vendorServiceArea.createMany({
      data: [
        {
          vendorId: demoVendor.vendorProfile.id,
          cityId: thanjavur.id,
          pincode: '613001',
          areaName: 'Old Bus Stand',
        },
        {
          vendorId: demoVendor.vendorProfile.id,
          cityId: thanjavur.id,
          pincode: '613005',
          areaName: 'Medical College Road',
        },
      ],
      skipDuplicates: true,
    })

    const electricianServices = await prisma.subService.findMany({
      where: {
        category: {
          slug: 'electrician',
        },
      },
      take: 3,
    })

    await prisma.vendorSkill.createMany({
      data: electricianServices.map((subService) => ({
        vendorId: demoVendor.vendorProfile!.id,
        subServiceId: subService.id,
        isActive: true,
      })),
      skipDuplicates: true,
    })
  }

  const existingHomeAddress = await prisma.address.findFirst({
    where: {
      userId: demoCustomer.id,
      label: 'Home',
    },
  })

  if (existingHomeAddress) {
    await prisma.address.update({
      where: { id: existingHomeAddress.id },
      data: {
        cityId: thanjavur.id,
        line1: '12, South Main Street',
        landmark: 'Near old bus stand',
        pincode: '613001',
        lat: '10.7869991',
        lng: '79.1378274',
        isDefault: true,
      },
    })
  } else {
    await prisma.address.create({
      data: {
        userId: demoCustomer.id,
        cityId: thanjavur.id,
        label: 'Home',
        line1: '12, South Main Street',
        landmark: 'Near old bus stand',
        pincode: '613001',
        lat: '10.7869991',
        lng: '79.1378274',
        isDefault: true,
      },
    })
  }

  console.info(
    JSON.stringify(
      {
        message: 'Seed completed',
        city: thanjavur.slug,
        admin: admin.email,
        demoCustomer: demoCustomer.email,
        demoVendor: demoVendor.email,
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
