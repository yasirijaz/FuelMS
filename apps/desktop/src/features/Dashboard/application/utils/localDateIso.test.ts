import { getLocalDateIso } from './localDateIso'

describe('getLocalDateIso', () => {
  it('formats the local calendar date', () => {
    const iso = getLocalDateIso(new Date(2026, 5, 20, 23, 59, 59))
    expect(iso).toBe('2026-06-20')
  })
})
