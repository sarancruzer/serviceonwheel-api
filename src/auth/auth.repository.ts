import { Injectable } from '@nestjs/common'
import {
  PasswordResetToken,
  Prisma,
  RefreshToken,
  Role,
  User,
  UserRole,
  VendorProfile,
} from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

export type UserWithRoles = User & {
  roles: UserRole[]
  vendorProfile: VendorProfile | null
}

export type RefreshTokenWithUser = RefreshToken & {
  user: UserWithRoles
}

export type PasswordResetWithUser = PasswordResetToken & {
  user: User
}

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserByEmail(email: string): Promise<UserWithRoles | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: true,
        vendorProfile: true,
      },
    })
  }

  findUserById(userId: string): Promise<UserWithRoles | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: true,
        vendorProfile: true,
      },
    })
  }

  createUser(data: {
    email: string
    passwordHash: string
    name: string
    phone?: string | null
    roles: Role[]
  }): Promise<UserWithRoles> {
    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name,
        phone: data.phone ?? null,
        roles: {
          create: data.roles.map((role) => ({ role })),
        },
      },
      include: {
        roles: true,
        vendorProfile: true,
      },
    })
  }

  updateUserProfile(userId: string, data: Prisma.UserUpdateInput): Promise<UserWithRoles> {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      include: {
        roles: true,
        vendorProfile: true,
      },
    })
  }

  async addRole(userId: string, role: Role): Promise<void> {
    await this.prisma.userRole.upsert({
      where: {
        userId_role: {
          userId,
          role,
        },
      },
      update: {},
      create: {
        userId,
        role,
      },
    })
  }

  async markFailedLogin(
    userId: string,
    failedLoginCount: number,
    lockedUntil: Date | null,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginCount,
        lockedUntil,
      },
    })
  }

  async markSuccessfulLogin(userId: string, lastLoginAt: Date): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt,
      },
    })
  }

  createRefreshToken(data: {
    userId: string
    tokenHash: string
    expiresAt: Date
    userAgent?: string | null
    ipAddress?: string | null
  }): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({
      data,
    })
  }

  findRefreshTokenByHash(tokenHash: string): Promise<RefreshTokenWithUser | null> {
    return this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            roles: true,
            vendorProfile: true,
          },
        },
      },
    })
  }

  async rotateRefreshToken(
    refreshTokenId: string,
    replacedByTokenHash: string,
    nextToken: {
      userId: string
      tokenHash: string
      expiresAt: Date
      userAgent?: string | null
      ipAddress?: string | null
    },
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { id: refreshTokenId },
        data: {
          revokedAt: new Date(),
          replacedByTokenHash,
        },
      }),
      this.prisma.refreshToken.create({
        data: nextToken,
      }),
    ])
  }

  async revokeRefreshTokenByHash(tokenHash: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    })
  }

  async revokeAllActiveRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    })
  }

  createPasswordResetToken(data: {
    userId: string
    tokenHash: string
    expiresAt: Date
  }): Promise<PasswordResetToken> {
    return this.prisma.passwordResetToken.create({
      data,
    })
  }

  findPasswordResetToken(tokenHash: string): Promise<PasswordResetWithUser | null> {
    return this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: {
        user: true,
      },
    })
  }

  async markPasswordResetUsed(passwordResetTokenId: string): Promise<void> {
    await this.prisma.passwordResetToken.update({
      where: { id: passwordResetTokenId },
      data: {
        usedAt: new Date(),
      },
    })
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        failedLoginCount: 0,
        lockedUntil: null,
      },
    })
  }
}
