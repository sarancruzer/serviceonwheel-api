import { registerAs } from '@nestjs/config'

export const authConfig = registerAs('auth', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET ?? 'change-me-super-secret',
  accessTtlMinutes: Number(process.env.JWT_ACCESS_TTL_MINUTES ?? 15),
  refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30),
  passwordMinLength: Number(process.env.PASSWORD_MIN_LENGTH ?? 8),
  lockMaxAttempts: Number(process.env.AUTH_LOCK_MAX_ATTEMPTS ?? 5),
  lockMinutes: Number(process.env.AUTH_LOCK_MINUTES ?? 15),
  resetTokenTtlMinutes: Number(process.env.RESET_TOKEN_TTL_MINUTES ?? 30),
  commissionRatePct: Number(process.env.COMMISSION_RATE_PCT ?? 20),
}))
