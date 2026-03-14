import { Role } from '@prisma/client'
import { AuthService } from '../../src/auth/auth.service'
import { hashOpaqueToken, hashPassword } from '../../src/common/utils/password.util'

describe('AuthService', () => {
  const baseConfig = {
    accessSecret: 'test-secret',
    accessTtlMinutes: 15,
    refreshTokenTtlDays: 30,
    passwordMinLength: 8,
    lockMaxAttempts: 5,
    lockMinutes: 15,
    resetTokenTtlMinutes: 30,
    commissionRatePct: 20,
  }

  const jwtService = {
    sign: jest.fn().mockReturnValue('access-token'),
  }

  const mailService = {
    sendPasswordResetEmail: jest.fn(),
  }

  function createRepository() {
    return {
      findRefreshTokenByHash: jest.fn(),
      rotateRefreshToken: jest.fn(),
      revokeAllActiveRefreshTokens: jest.fn(),
      findUserByEmail: jest.fn(),
      markFailedLogin: jest.fn(),
      markSuccessfulLogin: jest.fn(),
      findUserById: jest.fn(),
      createRefreshToken: jest.fn(),
    }
  }

  async function createUser(overrides: Record<string, unknown> = {}) {
    const passwordHash = await hashPassword('CorrectPass@123')

    return {
      id: 'user-1',
      email: 'customer@example.com',
      passwordHash,
      name: 'Customer Demo',
      phone: null,
      isActive: true,
      failedLoginCount: 0,
      lockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
      roles: [
        {
          id: 'role-1',
          userId: 'user-1',
          role: Role.CUSTOMER,
          createdAt: new Date(),
        },
      ],
      vendorProfile: null,
      ...overrides,
    }
  }

  it('rotates refresh tokens and returns a new token pair', async () => {
    const repository = createRepository()
    const service = new AuthService(
      repository as never,
      jwtService as never,
      mailService as never,
      baseConfig as never,
    )
    const user = await createUser()

    repository.findRefreshTokenByHash.mockResolvedValue({
      id: 'refresh-id',
      userId: user.id,
      tokenHash: hashOpaqueToken('old-refresh-token'),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      replacedByTokenHash: null,
      userAgent: null,
      ipAddress: null,
      user,
    })

    repository.rotateRefreshToken.mockResolvedValue(undefined)

    const response = await service.refresh(
      { refreshToken: 'old-refresh-token' },
      { ipAddress: '127.0.0.1', userAgent: 'jest' },
    )

    expect(response.accessToken).toBe('access-token')
    expect(response.refreshToken).not.toBe('old-refresh-token')
    expect(repository.rotateRefreshToken).toHaveBeenCalledWith(
      'refresh-id',
      expect.any(String),
      expect.objectContaining({
        userId: user.id,
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      }),
    )
  })

  it('revokes active sessions when a revoked refresh token is reused', async () => {
    const repository = createRepository()
    const service = new AuthService(
      repository as never,
      jwtService as never,
      mailService as never,
      baseConfig as never,
    )
    const user = await createUser()

    repository.findRefreshTokenByHash.mockResolvedValue({
      id: 'refresh-id',
      userId: user.id,
      tokenHash: hashOpaqueToken('reused-token'),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: new Date(),
      replacedByTokenHash: 'replacement-hash',
      userAgent: null,
      ipAddress: null,
      user,
    })

    await expect(service.refresh({ refreshToken: 'reused-token' }, {})).rejects.toMatchObject({
      code: 'REFRESH_TOKEN_REUSE_DETECTED',
    })

    expect(repository.revokeAllActiveRefreshTokens).toHaveBeenCalledWith(user.id)
  })

  it('locks the account after the configured number of failed attempts', async () => {
    const repository = createRepository()
    const service = new AuthService(
      repository as never,
      jwtService as never,
      mailService as never,
      baseConfig as never,
    )
    const user = await createUser({ failedLoginCount: 4 })

    repository.findUserByEmail.mockResolvedValue(user)

    await expect(
      service.login({ email: user.email, password: 'WrongPass@123' }, {}),
    ).rejects.toThrow('Invalid email or password.')

    expect(repository.markFailedLogin).toHaveBeenCalledWith(user.id, 5, expect.any(Date))
  })

  it('resets lockout counters on successful login', async () => {
    const repository = createRepository()
    const service = new AuthService(
      repository as never,
      jwtService as never,
      mailService as never,
      baseConfig as never,
    )
    const user = await createUser({ failedLoginCount: 2 })

    repository.findUserByEmail.mockResolvedValue(user)
    repository.findUserById.mockResolvedValue(user)
    repository.createRefreshToken.mockResolvedValue(undefined)

    await service.login({ email: user.email, password: 'CorrectPass@123' }, {})

    expect(repository.markSuccessfulLogin).toHaveBeenCalledWith(user.id, expect.any(Date))
  })
})
