import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import type { Response } from 'express'
import { AppException } from '../exceptions/app.exception'
import type { RequestWithContext } from '../interfaces/request-context.interface'

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp()
    const response = context.getResponse<Response>()
    const request = context.getRequest<RequestWithContext>()

    const { status, code, message, details } = this.normalizeException(exception)

    response.status(status).json({
      code,
      message,
      details,
      requestId: request.requestId ?? 'unknown',
      timestamp: new Date().toISOString(),
    })
  }

  private normalizeException(exception: unknown): {
    status: number
    code: string
    message: string
    details: unknown
  } {
    if (exception instanceof AppException) {
      return {
        status: exception.getStatus(),
        code: exception.code,
        message: exception.message,
        details: exception.details,
      }
    }

    if (exception instanceof PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        return {
          status: HttpStatus.CONFLICT,
          code: 'RESOURCE_CONFLICT',
          message: 'A record with the same unique value already exists.',
          details: exception.meta ?? null,
        }
      }

      if (exception.code === 'P2025') {
        return {
          status: HttpStatus.NOT_FOUND,
          code: 'RESOURCE_NOT_FOUND',
          message: 'The requested record was not found.',
          details: exception.meta ?? null,
        }
      }

      return {
        status: HttpStatus.BAD_REQUEST,
        code: 'DATABASE_ERROR',
        message: 'Database request failed.',
        details: exception.meta ?? null,
      }
    }

    if (exception instanceof HttpException) {
      const response = exception.getResponse()
      const status = exception.getStatus()
      const normalizedResponse =
        typeof response === 'string' ? { message: response } : (response as Record<string, unknown>)

      const messageValue = normalizedResponse.message
      const details = Array.isArray(messageValue)
        ? messageValue
        : (normalizedResponse.details ?? null)

      return {
        status,
        code:
          (normalizedResponse.code as string | undefined) ??
          this.mapStatusToCode(status, Array.isArray(messageValue)),
        message:
          (Array.isArray(messageValue)
            ? 'Request validation failed.'
            : (messageValue as string | undefined)) ?? 'Request failed.',
        details,
      }
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred.',
      details: null,
    }
  }

  private mapStatusToCode(status: number, isValidation: boolean): string {
    if (isValidation) {
      return 'VALIDATION_ERROR'
    }

    const map: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMITED',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
    }

    return map[status] ?? 'REQUEST_FAILED'
  }
}
