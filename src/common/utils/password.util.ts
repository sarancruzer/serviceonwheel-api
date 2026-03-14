import * as bcrypt from 'bcryptjs'
import { createHash, randomBytes } from 'crypto'
import { AppException } from '../exceptions/app.exception'

export function hashPassword(value: string): Promise<string> {
  return bcrypt.hash(value, 10)
}

export function verifyPassword(value: string, hash: string): Promise<boolean> {
  return bcrypt.compare(value, hash)
}

export function ensurePasswordPolicy(password: string, minLength: number): void {
  if (password.length < minLength) {
    throw new AppException(
      'PASSWORD_POLICY_FAILED',
      `Password must be at least ${minLength} characters long.`,
    )
  }
}

export function generateOpaqueToken(bytes = 48): string {
  return randomBytes(bytes).toString('base64url')
}

export function hashOpaqueToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}
