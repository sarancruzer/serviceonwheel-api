import { Module } from '@nestjs/common'
import { AuditModule } from '../audit/audit.module'
import { CatalogModule } from '../catalog/catalog.module'
import { ProvidersModule } from '../providers/providers.module'
import { StorageModule } from '../storage/storage.module'
import { AdminBookingsController } from './admin-bookings.controller'
import { BookingsRepository } from './bookings.repository'
import { BookingsService } from './bookings.service'
import { PublicBookingsController } from './public-bookings.controller'

@Module({
  imports: [AuditModule, CatalogModule, ProvidersModule, StorageModule],
  controllers: [PublicBookingsController, AdminBookingsController],
  providers: [BookingsRepository, BookingsService],
  exports: [BookingsRepository, BookingsService],
})
export class BookingsModule {}
