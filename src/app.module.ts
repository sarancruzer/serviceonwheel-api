import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule, ConfigType } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { AuditModule } from './audit/audit.module'
import { AuthModule } from './auth/auth.module'
import { BookingsModule } from './bookings/bookings.module'
import { CatalogModule } from './catalog/catalog.module'
import { CommonModule } from './common/common.module'
import { RequestIdMiddleware } from './common/middleware/request-id.middleware'
import { configuration } from './config/configuration'
import { securityConfig } from './config/security.config'
import { validateEnv } from './config/env.validation'
import { CustomersModule } from './customers/customers.module'
import { HealthModule } from './health/health.module'
import { MailModule } from './mail/mail.module'
import { PrismaModule } from './prisma/prisma.module'
import { ProvidersModule } from './providers/providers.module'
import { ReportsModule } from './reports/reports.module'
import { SettlementsModule } from './settlements/settlements.module'
import { StorageModule } from './storage/storage.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: configuration,
      validate: validateEnv,
    }),
    ThrottlerModule.forRootAsync({
      inject: [securityConfig.KEY],
      useFactory: (security: ConfigType<typeof securityConfig>) => [
        {
          ttl: security.globalRateTtlSeconds * 1000,
          limit: security.globalRateLimit,
        },
      ],
    }),
    CommonModule,
    PrismaModule,
    MailModule,
    StorageModule,
    HealthModule,
    AuthModule,
    AuditModule,
    CatalogModule,
    ProvidersModule,
    BookingsModule,
    CustomersModule,
    SettlementsModule,
    ReportsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*')
  }
}
