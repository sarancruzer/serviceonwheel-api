import { registerAs } from '@nestjs/config'

export const appConfig = registerAs('app', () => ({
  name: process.env.APP_NAME ?? 'serviceonwheel-api',
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3001),
  swaggerPath: process.env.APP_SWAGGER_PATH ?? 'docs',
}))
