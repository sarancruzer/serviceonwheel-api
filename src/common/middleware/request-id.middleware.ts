import { Injectable, NestMiddleware } from '@nestjs/common'
import { randomUUID } from 'crypto'
import type { NextFunction, Response } from 'express'
import type { RequestWithContext } from '../interfaces/request-context.interface'
import { RequestContextService } from '../services/request-context.service'

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  constructor(private readonly requestContext: RequestContextService) {}

  use(request: RequestWithContext, response: Response, next: NextFunction): void {
    const incomingRequestId = request.header('x-request-id')
    const requestId = incomingRequestId?.trim() || randomUUID()

    request.requestId = requestId
    response.setHeader('X-Request-Id', requestId)

    this.requestContext.run({ requestId }, next)
  }
}
