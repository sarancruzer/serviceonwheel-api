import { plainToInstance, Transform } from 'class-transformer'
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  validateSync,
} from 'class-validator'

enum NodeEnvironment {
  DEVELOPMENT = 'development',
  TEST = 'test',
  PRODUCTION = 'production',
}

class EnvironmentVariables {
  @IsEnum(NodeEnvironment)
  NODE_ENV: NodeEnvironment = NodeEnvironment.DEVELOPMENT

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  PORT = 3001

  @IsString()
  APP_NAME = 'serviceonwheel-api'

  @IsString()
  APP_SWAGGER_PATH = 'docs'

  @IsString()
  DATABASE_URL = 'postgresql://saravanannandhan@127.0.0.1:5432/serviceonwheel?schema=public'

  @IsString()
  JWT_ACCESS_SECRET = 'change-me-super-secret'

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  JWT_ACCESS_TTL_MINUTES = 15

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  REFRESH_TOKEN_TTL_DAYS = 30

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(8)
  PASSWORD_MIN_LENGTH = 8

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  AUTH_LOCK_MAX_ATTEMPTS = 5

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  AUTH_LOCK_MINUTES = 15

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  RESET_TOKEN_TTL_MINUTES = 30

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  COMMISSION_RATE_PCT = 20

  @IsString()
  CORS_ORIGINS = ''

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  GLOBAL_RATE_LIMIT = 300

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  GLOBAL_RATE_TTL_SECONDS = 60

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  AUTH_RATE_LIMIT = 10

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  AUTH_RATE_TTL_SECONDS = 60

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  PUBLIC_BOOKING_RATE_LIMIT = 12

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  PUBLIC_BOOKING_RATE_TTL_SECONDS = 60

  @IsString()
  AWS_REGION = 'ap-south-1'

  @IsString()
  AWS_S3_BUCKET = 'serviceonwheel-uploads'

  @IsString()
  AWS_ACCESS_KEY_ID = 'dummy-access-key'

  @IsString()
  AWS_SECRET_ACCESS_KEY = 'dummy-secret-key'

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(60)
  AWS_PRESIGN_TTL_SECONDS = 900

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1024)
  AWS_UPLOAD_MAX_SIZE_BYTES = 5 * 1024 * 1024

  @IsString()
  AWS_ALLOWED_CONTENT_TYPES = 'image/jpeg,image/png,image/webp'

  @IsString()
  SMTP_HOST = 'localhost'

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  SMTP_PORT = 1025

  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  SMTP_SECURE = false

  @IsOptional()
  @IsString()
  SMTP_USER?: string

  @IsOptional()
  @IsString()
  SMTP_PASS?: string

  @IsEmail()
  SMTP_FROM_EMAIL = 'no-reply@serviceonwheel.local'

  @IsString()
  SMTP_FROM_NAME = 'ServiceOnWheel'

  @IsString()
  RESET_PASSWORD_URL_BASE = 'http://localhost:3000/reset-password'

  @IsEmail()
  ADMIN_SEED_EMAIL = 'admin@serviceonwheel.local'

  @IsString()
  ADMIN_SEED_PASSWORD = 'Admin@12345'

  @IsString()
  ADMIN_SEED_NAME = 'Platform Admin'

  @IsEmail()
  DEMO_CUSTOMER_EMAIL = 'customer@serviceonwheel.local'

  @IsString()
  DEMO_CUSTOMER_PASSWORD = 'Customer@123'

  @IsString()
  DEMO_CUSTOMER_NAME = 'Demo Customer'

  @IsEmail()
  DEMO_VENDOR_EMAIL = 'vendor@serviceonwheel.local'

  @IsString()
  DEMO_VENDOR_PASSWORD = 'Vendor@123'

  @IsString()
  DEMO_VENDOR_NAME = 'Demo Vendor'
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  })

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  })

  if (errors.length > 0) {
    throw new Error(errors.toString())
  }

  return validatedConfig
}
