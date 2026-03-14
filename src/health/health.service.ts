import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  getHealth() {
    return {
      status: 'ok',
      service: 'serviceonwheel-api',
      timestamp: new Date().toISOString(),
    }
  }

  async getDatabaseHealth() {
    await this.prisma.$queryRaw`SELECT 1`

    return {
      status: 'ok',
      service: 'serviceonwheel-api',
      database: 'postgres',
      timestamp: new Date().toISOString(),
    }
  }
}
