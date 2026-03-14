import { Module } from '@nestjs/common'
import { AuditModule } from '../audit/audit.module'
import { SettlementsController } from './settlements.controller'
import { SettlementsRepository } from './settlements.repository'
import { SettlementsService } from './settlements.service'

@Module({
  imports: [AuditModule],
  controllers: [SettlementsController],
  providers: [SettlementsRepository, SettlementsService],
  exports: [SettlementsService],
})
export class SettlementsModule {}
