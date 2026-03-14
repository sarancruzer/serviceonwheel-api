import { Module } from '@nestjs/common'
import { AuditModule } from '../audit/audit.module'
import { ProvidersController } from './providers.controller'
import { ProvidersRepository } from './providers.repository'
import { ProvidersService } from './providers.service'
import { VendorProfileController } from './vendor-profile.controller'

@Module({
  imports: [AuditModule],
  controllers: [ProvidersController, VendorProfileController],
  providers: [ProvidersRepository, ProvidersService],
  exports: [ProvidersRepository, ProvidersService],
})
export class ProvidersModule {}
