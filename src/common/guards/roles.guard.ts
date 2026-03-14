import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Role } from '@prisma/client'
import { ROLES_KEY } from '../decorators/roles.decorator'
import type { RequestWithContext } from '../interfaces/request-context.interface'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!roles || roles.length === 0) {
      return true
    }

    const request = context.switchToHttp().getRequest<RequestWithContext>()
    const user = request.user

    if (!user) {
      throw new UnauthorizedException()
    }

    const hasRole = roles.some((role) => user.roles.includes(role))

    if (!hasRole) {
      throw new ForbiddenException('Insufficient role for this route.')
    }

    return true
  }
}
