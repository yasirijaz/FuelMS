import { describe, expect, it } from 'vitest'
import { toIsoFromDateInput, toLocalDateInputValue } from './dateInput'

describe('dateInput utils', () => {
  it('formats local calendar dates for date inputs', () => {
    expect(toLocalDateInputValue(new Date(2026, 5, 20, 23, 59, 59))).toBe('2026-06-20')
  })

  it('converts YYYY-MM-DD to ISO without throwing', () => {
    const iso = toIsoFromDateInput('2026-06-20')
    expect(iso).toMatch(/^2026-06-20T/)
  })

  it('accepts existing ISO strings without throwing', () => {
    const source = '2026-06-20T10:00:00.000Z'
    expect(() => toIsoFromDateInput(source)).not.toThrow()
    expect(toIsoFromDateInput(source)).toMatch(/^2026-06-20T/)
  })
})
