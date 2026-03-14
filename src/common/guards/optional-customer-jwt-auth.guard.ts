import { ExecutionContext, Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import type { Request } from 'express'

@Injectable()
export class OptionalCustomerJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>()
    const authorization = request.headers.authorization

    if (!authorization) {
      return true
    }

    return super.canActivate(context)
  }
}
