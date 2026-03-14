import { randomBytes } from 'crypto'

export function generateBookingCode(length = 12): string {
  const code = randomBytes(Math.ceil(length * 0.75))
    .toString('base64url')
    .replace(/[^a-zA-Z0-9]/g, '')

  return code.slice(0, Math.max(length, 12))
}
