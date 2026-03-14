import type { Role } from '@prisma/client'
import type { Request } from 'express'

export interface AuthenticatedUser {
  sub: string
  email: string
  name: string
  roles: Role[]
}

export type AuthenticatedAdminUser = AuthenticatedUser
export type AuthenticatedCustomerUser = AuthenticatedUser
export type AuthenticatedVendorUser = AuthenticatedUser

export interface RequestWithContext extends Request {
  requestId: string
  user?: AuthenticatedUser
}
