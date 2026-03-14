import { config as loadEnv } from 'dotenv'
import { defineConfig } from 'prisma/config'

loadEnv()

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url:
      process.env.DATABASE_URL ??
      'postgresql://saravanannandhan@127.0.0.1:5432/serviceonwheel?schema=public',
  },
  seed: 'ts-node --project tsconfig.json --transpile-only prisma/seed.ts',
})
