import { registerAs } from '@nestjs/config'

export const securityConfig = registerAs('security', () => ({
  corsOrigins: (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
  globalRateLimit: Number(process.env.GLOBAL_RATE_LIMIT ?? 300),
  globalRateTtlSeconds: Number(process.env.GLOBAL_RATE_TTL_SECONDS ?? 60),
  authRateLimit: Number(process.env.AUTH_RATE_LIMIT ?? 10),
  authRateTtlSeconds: Number(process.env.AUTH_RATE_TTL_SECONDS ?? 60),
  publicBookingRateLimit: Number(process.env.PUBLIC_BOOKING_RATE_LIMIT ?? 12),
  publicBookingRateTtlSeconds: Number(process.env.PUBLIC_BOOKING_RATE_TTL_SECONDS ?? 60),
}))
