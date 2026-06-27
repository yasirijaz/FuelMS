import { describe, expect, it } from 'vitest'
import {
  formatMoneyDisplay,
  minorToRupees,
  parseMoneyInputToMinor,
  rupeesToMinor,
} from '@fuelms/shared'
import { formatFuelQuantity, parseFuelQuantityInput, roundFuelQuantity } from '@fuelms/shared'

describe('money helpers', () => {
  it('converts rupees to paisa without float drift', () => {
    expect(rupeesToMinor(295)).toBe(29500)
    expect(minorToRupees(29500)).toBe(295)
  })

  it('parses money input to paisa', () => {
    expect(parseMoneyInputToMinor('1,234.50')).toBe(123450)
    expect(parseMoneyInputToMinor('')).toBeNull()
    expect(parseMoneyInputToMinor('-1')).toBeNull()
  })

  it('formats display amounts', () => {
    expect(formatMoneyDisplay(14520000)).toContain('145,200')
  })
})

describe('fuel quantity helpers', () => {
  it('rounds to three decimals', () => {
    expect(roundFuelQuantity(1.23456)).toBe(1.235)
  })

  it('parses quantity input', () => {
    expect(parseFuelQuantityInput('1500.5')).toBe(1500.5)
    expect(parseFuelQuantityInput('1.2344')).toBe(1.234)
    expect(parseFuelQuantityInput('abc')).toBeNull()
  })

  it('formats litres', () => {
    expect(formatFuelQuantity(50)).toBe('50.000 L')
  })
})
