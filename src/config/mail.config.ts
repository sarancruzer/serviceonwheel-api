import { registerAs } from '@nestjs/config'

export const mailConfig = registerAs('mail', () => ({
  host: process.env.SMTP_HOST ?? 'localhost',
  port: Number(process.env.SMTP_PORT ?? 1025),
  secure: (process.env.SMTP_SECURE ?? 'false') === 'true',
  user: process.env.SMTP_USER ?? '',
  pass: process.env.SMTP_PASS ?? '',
  fromEmail: process.env.SMTP_FROM_EMAIL ?? 'no-reply@serviceonwheel.local',
  fromName: process.env.SMTP_FROM_NAME ?? 'ServiceOnWheel',
  resetPasswordUrlBase:
    process.env.RESET_PASSWORD_URL_BASE ?? 'http://localhost:3000/reset-password',
}))
