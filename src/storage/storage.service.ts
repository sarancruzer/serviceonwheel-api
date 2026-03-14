import { Inject, Injectable } from '@nestjs/common'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { ConfigType } from '@nestjs/config'
import { PhotoKind } from '@prisma/client'
import { AppException } from '../common/exceptions/app.exception'
import { generateOpaqueToken } from '../common/utils/password.util'
import { awsConfig } from '../config/aws.config'

const extensionMap: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
}

@Injectable()
export class StorageService {
  private readonly s3Client: S3Client

  constructor(
    @Inject(awsConfig.KEY)
    private readonly config: ConfigType<typeof awsConfig>,
  ) {
    this.s3Client = new S3Client({
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    })
  }

  async createPresignedUpload(params: {
    bookingCode: string
    kind: PhotoKind
    contentType: string
    fileExt: string
  }) {
    this.ensureContentTypeAllowed(params.contentType, params.fileExt)

    const normalizedExt = params.fileExt.replace(/^\./, '').toLowerCase()
    const s3Key = `bookings/${params.bookingCode}/${params.kind.toLowerCase()}/${generateOpaqueToken(
      12,
    )}.${normalizedExt}`

    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: s3Key,
      ContentType: params.contentType,
    })

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: this.config.presignTtlSeconds,
    })

    return {
      uploadUrl,
      s3Key,
      expiresIn: this.config.presignTtlSeconds,
      maxSizeBytes: this.config.uploadMaxSizeBytes,
    }
  }

  ensureContentTypeAllowed(contentType: string, fileExt: string): void {
    if (!this.config.allowedContentTypes.includes(contentType)) {
      throw new AppException(
        'UPLOAD_CONTENT_TYPE_NOT_ALLOWED',
        'The provided upload content type is not allowed.',
      )
    }

    const allowedExtensions = extensionMap[contentType] ?? []
    const normalizedExt = fileExt.replace(/^\./, '').toLowerCase()

    if (!allowedExtensions.includes(normalizedExt)) {
      throw new AppException(
        'UPLOAD_EXTENSION_NOT_ALLOWED',
        'The provided file extension does not match the content type.',
      )
    }
  }
}
