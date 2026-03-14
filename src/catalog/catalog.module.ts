import { Module } from '@nestjs/common'
import { AuditModule } from '../audit/audit.module'
import { AdminCatalogController } from './admin-catalog.controller'
import { CatalogRepository } from './catalog.repository'
import { CatalogService } from './catalog.service'
import { PublicCatalogController } from './public-catalog.controller'

@Module({
  imports: [AuditModule],
  controllers: [PublicCatalogController, AdminCatalogController],
  providers: [CatalogRepository, CatalogService],
  exports: [CatalogRepository, CatalogService],
})
export class CatalogModule {}
