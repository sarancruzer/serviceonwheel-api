import { ApiProperty } from '@nestjs/swagger'

export class ApiErrorResponseDto {
  @ApiProperty({ example: 'VALIDATION_ERROR' })
  code: string

  @ApiProperty({ example: 'Request validation failed.' })
  message: string

  @ApiProperty({
    example: [
      {
        field: 'email',
        errors: ['email must be an email'],
      },
    ],
    nullable: true,
  })
  details: unknown

  @ApiProperty({ example: 'c46bfd8f-2ca8-4db5-94a3-406502eb7af6' })
  requestId: string

  @ApiProperty({ example: '2026-03-13T10:30:00.000Z' })
  timestamp: string
}
