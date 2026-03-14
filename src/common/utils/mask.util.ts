export function maskPhone(phone?: string | null): string | null {
  if (!phone) {
    return null
  }

  const digits = phone.replace(/\D/g, '')

  if (digits.length < 4) {
    return `${digits[0] ?? ''}${'*'.repeat(Math.max(digits.length - 1, 0))}`
  }

  return `${digits.slice(0, 2)}${'*'.repeat(Math.max(digits.length - 4, 0))}${digits.slice(-2)}`
}

export function maskAddress(address: string): string {
  const normalized = address.trim()

  if (normalized.length <= 10) {
    return `${normalized.slice(0, 3)}***`
  }

  return `${normalized.slice(0, 10)}...`
}
