import { HttpStatus, Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigType } from '@nestjs/config'
import { Role } from '@prisma/client'
import { AppException } from '../common/exceptions/app.exception'
import {
  ensurePasswordPolicy,
  generateOpaqueToken,
  hashOpaqueToken,
  hashPassword,
  normalizeEmail,
  verifyPassword,
} from '../common/utils/password.util'
import { authConfig } from '../config/auth.config'
import { MailService } from '../mail/mail.service'
import { AuthRepository, UserWithRoles } from './auth.repository'
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  LogoutDto,
  RefreshDto,
  RegisterDto,
  ResetPasswordDto,
  UpdateProfileDto,
} from './dto/auth.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    @Inject(authConfig.KEY)
    private readonly config: ConfigType<typeof authConfig>,
  ) {}

  async register(
    payload: RegisterDto,
    requestMeta: {
      ipAddress?: string
      userAgent?: string
    },
  ) {
    const email = normalizeEmail(payload.email)
    ensurePasswordPolicy(payload.password, this.config.passwordMinLength)

    const existingUser = await this.authRepository.findUserByEmail(email)

    if (existingUser) {
      throw new AppException(
        'EMAIL_ALREADY_EXISTS',
        'Email is already registered.',
        HttpStatus.CONFLICT,
      )
    }

    const passwordHash = await hashPassword(payload.password)
    const user = await this.authRepository.createUser({
      email,
      passwordHash,
      name: payload.name.trim(),
      phone: payload.phone?.trim() ?? null,
      roles: [Role.CUSTOMER],
    })

    return this.buildAuthResponse(user, requestMeta)
  }

  async login(
    payload: LoginDto,
    requestMeta: {
      ipAddress?: string
      userAgent?: string
    },
  ) {
    const email = normalizeEmail(payload.email)
    const user = await this.authRepository.findUserByEmail(email)

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.')
    }

    if (!user.isActive) {
      throw new AppException('ACCOUNT_INACTIVE', 'This account is inactive.', HttpStatus.FORBIDDEN)
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AppException(
        'ACCOUNT_LOCKED',
        `Account is locked until ${user.lockedUntil.toISOString()}.`,
        423 as HttpStatus,
      )
    }

    const isPasswordValid = await verifyPassword(payload.password, user.passwordHash)

    if (!isPasswordValid) {
      const failedLoginCount = user.failedLoginCount + 1
      const shouldLock = failedLoginCount >= this.config.lockMaxAttempts
      const lockedUntil = shouldLock
        ? new Date(Date.now() + this.config.lockMinutes * 60 * 1000)
        : null

      await this.authRepository.markFailedLogin(user.id, failedLoginCount, lockedUntil)

      throw new UnauthorizedException('Invalid email or password.')
    }

    await this.authRepository.markSuccessfulLogin(user.id, new Date())

    const freshUser = await this.authRepository.findUserById(user.id)

    if (!freshUser) {
      throw new AppException(
        'USER_NOT_FOUND',
        'User could not be loaded after login.',
        HttpStatus.NOT_FOUND,
      )
    }

    return this.buildAuthResponse(freshUser, requestMeta)
  }

  async refresh(
    payload: RefreshDto,
    requestMeta: {
      ipAddress?: string
      userAgent?: string
    },
  ) {
    const tokenHash = hashOpaqueToken(payload.refreshToken)
    const existingToken = await this.authRepository.findRefreshTokenByHash(tokenHash)

    if (!existingToken) {
      throw new UnauthorizedException('Invalid refresh token.')
    }

    if (existingToken.revokedAt) {
      await this.authRepository.revokeAllActiveRefreshTokens(existingToken.userId)
      throw new AppException(
        'REFRESH_TOKEN_REUSE_DETECTED',
        'Refresh token reuse detected. All active sessions have been revoked.',
        HttpStatus.UNAUTHORIZED,
      )
    }

    if (existingToken.expiresAt <= new Date()) {
      await this.authRepository.revokeRefreshTokenByHash(tokenHash)
      throw new UnauthorizedException('Refresh token has expired.')
    }

    if (!existingToken.user.isActive) {
      throw new AppException('ACCOUNT_INACTIVE', 'This account is inactive.', HttpStatus.FORBIDDEN)
    }

    const nextRefreshToken = this.generateRefreshToken()
    const nextRefreshTokenHash = hashOpaqueToken(nextRefreshToken)

    await this.authRepository.rotateRefreshToken(existingToken.id, nextRefreshTokenHash, {
      userId: existingToken.userId,
      tokenHash: nextRefreshTokenHash,
      expiresAt: this.buildRefreshTokenExpiry(),
      ipAddress: requestMeta.ipAddress ?? null,
      userAgent: requestMeta.userAgent ?? null,
    })

    return this.buildTokenResponse(existingToken.user, nextRefreshToken)
  }

  async logout(payload: LogoutDto) {
    const tokenHash = hashOpaqueToken(payload.refreshToken)
    await this.authRepository.revokeRefreshTokenByHash(tokenHash)
    return { message: 'Logged out successfully.' }
  }

  async forgotPassword(payload: ForgotPasswordDto) {
    const email = normalizeEmail(payload.email)
    const user = await this.authRepository.findUserByEmail(email)

    if (!user) {
      return { message: 'If the account exists, a reset link has been sent.' }
    }

    const rawToken = generateOpaqueToken(32)
    const tokenHash = hashOpaqueToken(rawToken)

    await this.authRepository.createPasswordResetToken({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + this.config.resetTokenTtlMinutes * 60 * 1000),
    })

    await this.mailService.sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      token: rawToken,
      expiresInMinutes: this.config.resetTokenTtlMinutes,
    })

    return { message: 'If the account exists, a reset link has been sent.' }
  }

  async resetPassword(payload: ResetPasswordDto) {
    ensurePasswordPolicy(payload.newPassword, this.config.passwordMinLength)
    const tokenHash = hashOpaqueToken(payload.token)
    const resetToken = await this.authRepository.findPasswordResetToken(tokenHash)

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
      throw new AppException(
        'RESET_TOKEN_INVALID',
        'Password reset token is invalid or expired.',
        HttpStatus.UNAUTHORIZED,
      )
    }

    const passwordHash = await hashPassword(payload.newPassword)
    await this.authRepository.updatePassword(resetToken.userId, passwordHash)
    await this.authRepository.markPasswordResetUsed(resetToken.id)
    await this.authRepository.revokeAllActiveRefreshTokens(resetToken.userId)

    return { message: 'Password has been reset successfully.' }
  }

  async changePassword(userId: string, payload: ChangePasswordDto) {
    ensurePasswordPolicy(payload.newPassword, this.config.passwordMinLength)
    const user = await this.authRepository.findUserById(userId)

    if (!user) {
      throw new AppException('USER_NOT_FOUND', 'User not found.', HttpStatus.NOT_FOUND)
    }

    const isCurrentPasswordValid = await verifyPassword(payload.currentPassword, user.passwordHash)

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect.')
    }

    const passwordHash = await hashPassword(payload.newPassword)
    await this.authRepository.updatePassword(userId, passwordHash)
    await this.authRepository.revokeAllActiveRefreshTokens(userId)

    return { message: 'Password changed successfully.' }
  }

  async getMe(userId: string) {
    const user = await this.authRepository.findUserById(userId)

    if (!user) {
      throw new AppException('USER_NOT_FOUND', 'User not found.', HttpStatus.NOT_FOUND)
    }

    return this.serializeUser(user)
  }

  async updateMe(userId: string, payload: UpdateProfileDto) {
    const user = await this.authRepository.findUserById(userId)

    if (!user) {
      throw new AppException('USER_NOT_FOUND', 'User not found.', HttpStatus.NOT_FOUND)
    }

    const updatedUser = await this.authRepository.updateUserProfile(userId, {
      name: payload.name?.trim() ?? user.name,
      phone: payload.phone?.trim() ?? user.phone,
    })

    return this.serializeUser(updatedUser)
  }

  private async buildAuthResponse(
    user: UserWithRoles,
    requestMeta: {
      ipAddress?: string
      userAgent?: string
    },
  ) {
    const refreshToken = this.generateRefreshToken()
    const refreshTokenHash = hashOpaqueToken(refreshToken)

    await this.authRepository.createRefreshToken({
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: this.buildRefreshTokenExpiry(),
      ipAddress: requestMeta.ipAddress ?? null,
      userAgent: requestMeta.userAgent ?? null,
    })

    return this.buildTokenResponse(user, refreshToken)
  }

  private buildTokenResponse(user: UserWithRoles, refreshToken: string) {
    const roles = user.roles.map((role) => role.role)
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
      roles,
    })

    return {
      accessToken,
      refreshToken,
      expiresIn: this.config.accessTtlMinutes * 60,
      roles,
      user: this.serializeUser(user),
    }
  }

  private serializeUser(user: UserWithRoles) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      isActive: user.isActive,
      roles: user.roles.map((role) => role.role),
      vendorProfile: user.vendorProfile
        ? {
            id: user.vendorProfile.id,
            kycStatus: user.vendorProfile.kycStatus,
            isActive: user.vendorProfile.isActive,
          }
        : null,
    }
  }

  private generateRefreshToken(): string {
    return generateOpaqueToken(48)
  }

  private buildRefreshTokenExpiry(): Date {
    return new Date(Date.now() + this.config.refreshTokenTtlDays * 24 * 60 * 60 * 1000)
  }
}
