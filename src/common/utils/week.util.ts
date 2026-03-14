function startOfIsoWeek(date: Date): Date {
  const cloned = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = cloned.getUTCDay() || 7
  cloned.setUTCDate(cloned.getUTCDate() - day + 1)
  return cloned
}

export function getIsoWeekString(date: Date): string {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const isoWeekStart = startOfIsoWeek(target)
  const yearStart = startOfIsoWeek(new Date(Date.UTC(isoWeekStart.getUTCFullYear(), 0, 4)))
  const week =
    Math.floor((isoWeekStart.getTime() - yearStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1

  return `${isoWeekStart.getUTCFullYear()}-${String(week).padStart(2, '0')}`
}
