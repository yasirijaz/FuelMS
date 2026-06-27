/**
 * Formatting utilities — pure functions, no side effects.
 * Safe to use in domain logic, UI, and tests.
 */

/** Format whole or fractional rupees as "Rs. 1,234,567" (dashboard-friendly). */
export function formatRupee(amount: number, decimals = 0): string {
  const formatted = new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
  return `Rs. ${formatted}`
}

/** Format a number as Pakistani Rupees with thousands separator. */
export function formatCurrency(amount: number, decimals = 2): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
}

/** Format litres with 3 decimal precision. */
export function formatLitres(quantity: number): string {
  return `${quantity.toFixed(3)} L`
}

/** Format an ISO date string as a human-readable local date. */
export function formatDate(iso: string, locale = 'en-PK'): string {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}
