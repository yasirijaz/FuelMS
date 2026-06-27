/** Format a Date for `<input type="date">` (local calendar date). */
export function toLocalDateInputValue(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Inclusive calendar-date range for the month containing `reference`. */
export function getMonthDateRange(reference: Date = new Date()): {
  fromDateIso: string
  toDateIso: string
} {
  const from = new Date(reference.getFullYear(), reference.getMonth(), 1)
  const to = new Date(reference.getFullYear(), reference.getMonth() + 1, 0)
  return {
    fromDateIso: toLocalDateInputValue(from),
    toDateIso: toLocalDateInputValue(to),
  }
}

/** Compare sale/transaction ISO timestamps by local calendar date. */
export function isDateInRange(
  dateIso: string,
  fromDateIso?: string,
  toDateIso?: string,
): boolean {
  const dateOnly = dateIso.includes('T') ? (dateIso.split('T')[0] ?? dateIso) : dateIso
  if (fromDateIso && dateOnly < fromDateIso) return false
  if (toDateIso && dateOnly > toDateIso) return false
  return true
}

/** Convert a date input value or ISO string to a UTC ISO timestamp. */
export function toIsoFromDateInput(value: string, fallback: Date = new Date()): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return fallback.toISOString()
  }

  const dateOnly = trimmed.includes('T') ? (trimmed.split('T')[0] ?? trimmed) : trimmed
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    const localNoon = new Date(`${dateOnly}T12:00:00`)
    if (!Number.isNaN(localNoon.getTime())) {
      return localNoon.toISOString()
    }
  }

  const parsed = new Date(trimmed)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString()
  }

  return fallback.toISOString()
}
