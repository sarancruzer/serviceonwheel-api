export function moneyToCents(value: number | string): number {
  return Math.round(Number(value) * 100)
}

export function centsToMoney(value: number): string {
  return (value / 100).toFixed(2)
}

export function normalizeMoney(value: number | string): string {
  return centsToMoney(moneyToCents(value))
}
