import { Global, Module } from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'
import { ApiErrorResponseDto } from './dto/api-error-response.dto'
import { GlobalExceptionFilter } from './filters/global-exception.filter'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { OptionalCustomerJwtAuthGuard } from './guards/optional-customer-jwt-auth.guard'
import { RolesGuard } from './guards/roles.guard'
import { RequestLoggingInterceptor } from './interceptors/request-logging.interceptor'
import { AppLoggerService } from './services/app-logger.service'
import { RequestContextService } from './services/request-context.service'

@Global()
@Module({
  providers: [
    ApiErrorResponseDto,
    RequestContextService,
    AppLoggerService,
    RolesGuard,
    JwtAuthGuard,
    OptionalCustomerJwtAuthGuard,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
  ],
  exports: [
    RequestContextService,
    AppLoggerService,
    RolesGuard,
    JwtAuthGuard,
    OptionalCustomerJwtAuthGuard,
  ],
})
export class CommonModule {}
