import { registerAs } from '@nestjs/config'

export const databaseConfig = registerAs('database', () => ({
  url:
    process.env.DATABASE_URL ??
    'postgresql://saravanannandhan@127.0.0.1:5432/serviceonwheel?schema=public',
}))
