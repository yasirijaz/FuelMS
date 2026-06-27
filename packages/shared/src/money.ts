/** Paisa — integer minor units (100 paisa = 1 PKR). */
export type MoneyMinor = number

export const PAISA_PER_RUPEE = 100

export function rupeesToMinor(rupees: number): MoneyMinor {
  return Math.round(rupees * PAISA_PER_RUPEE)
}

export function minorToRupees(minor: MoneyMinor): number {
  return minor / PAISA_PER_RUPEE
}

export function formatMoneyMinor(minor: MoneyMinor, decimals = 2): string {
  return new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(minorToRupees(minor))
}

export function formatMoneyDisplay(minor: MoneyMinor, decimals = 2): string {
  return `Rs. ${formatMoneyMinor(minor, decimals)}`
}

/** Parse user-entered rupee text into paisa. Returns null when invalid. */
export function parseMoneyInputToMinor(raw: string): MoneyMinor | null {
  const normalized = raw.trim().replace(/,/g, '')
  if (normalized.length === 0) return null
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) return null

  const rupees = Number(normalized)
  if (!Number.isFinite(rupees) || rupees < 0) return null

  return rupeesToMinor(rupees)
}

export function parseMoneyInputToMinorAllowZero(raw: string): MoneyMinor | null {
  const normalized = raw.trim().replace(/,/g, '')
  if (normalized === '0' || normalized === '0.0' || normalized === '0.00') return 0
  return parseMoneyInputToMinor(raw)
}
