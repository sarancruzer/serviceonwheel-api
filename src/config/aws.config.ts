import { registerAs } from '@nestjs/config'

export const awsConfig = registerAs('aws', () => ({
  region: process.env.AWS_REGION ?? 'ap-south-1',
  bucket: process.env.AWS_S3_BUCKET ?? 'serviceonwheel-uploads',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'dummy-access-key',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'dummy-secret-key',
  presignTtlSeconds: Number(process.env.AWS_PRESIGN_TTL_SECONDS ?? 900),
  uploadMaxSizeBytes: Number(process.env.AWS_UPLOAD_MAX_SIZE_BYTES ?? 5 * 1024 * 1024),
  allowedContentTypes: (process.env.AWS_ALLOWED_CONTENT_TYPES ?? 'image/jpeg,image/png,image/webp')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
}))
