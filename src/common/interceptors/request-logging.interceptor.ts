import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable } from 'rxjs'
import type { RequestWithContext } from '../interfaces/request-context.interface'
import { AppLoggerService } from '../services/app-logger.service'

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithContext>()
    const response = context
      .switchToHttp()
      .getResponse<{ once: (event: string, listener: () => void) => void; statusCode: number }>()
    const startedAt = Date.now()
    let hasLogged = false

    const logResponse = () => {
      if (hasLogged) {
        return
      }

      hasLogged = true
      this.logger.logStructured('log', {
        requestId: request.requestId,
        method: request.method,
        route: request.originalUrl ?? request.url,
        status: response.statusCode,
        latencyMs: Date.now() - startedAt,
        userId: request.user?.sub ?? null,
      })
    }

    response.once('finish', logResponse)
    response.once('close', logResponse)

    return next.handle()
  }
}
