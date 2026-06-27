import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate, formatLitres, formatRupee } from './format'

describe('formatRupee', () => {
  it('formats amounts with Rs. prefix and grouping', () => {
    expect(formatRupee(2_450_000)).toBe('Rs. 2,450,000')
    expect(formatRupee(145_200)).toBe('Rs. 145,200')
  })
})

describe('formatCurrency', () => {
  it('formats positive PKR amounts with thousands separator', () => {
    const result = formatCurrency(1500)
    // The numeric part must be present; the currency symbol varies by OS locale
    expect(result).toContain('1,500')
  })

  it('formats zero as 0.00', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0.00')
  })

  it('respects decimal precision override', () => {
    const result = formatCurrency(100.1, 0)
    expect(result).not.toContain('.')
  })
})

describe('formatLitres', () => {
  it('returns 3 decimal places with L suffix', () => {
    expect(formatLitres(50)).toBe('50.000 L')
    expect(formatLitres(12.5)).toBe('12.500 L')
  })
})

describe('formatDate', () => {
  it('formats a valid ISO date', () => {
    const result = formatDate('2026-01-15T00:00:00Z')
    expect(result).toMatch(/15/)
    expect(result).toMatch(/2026/)
  })
})
