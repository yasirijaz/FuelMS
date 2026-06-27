import { describe, it, expect } from 'vitest'
import { ok, err, isOk, isErr, unwrap } from '@fuelms/core'
import { ValidationError } from '@fuelms/core'
import { ValueObject } from './ValueObject'

// ─── Test fixtures ────────────────────────────────────────────────────────────

interface MoneyProps { amount: number; currency: string }

class Money extends ValueObject<MoneyProps> {
  static create(amount: number, currency = 'PKR') {
    if (amount < 0) return err(new ValidationError('Amount cannot be negative'))
    return ok(new Money({ amount, currency }))
  }
  get amount() { return this.props.amount }
  get currency() { return this.props.currency }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ValueObject - equality', () => {
  it('two instances with the same props are equal', () => {
    const a = unwrap(Money.create(100))
    const b = unwrap(Money.create(100))
    expect(a.equals(b)).toBe(true)
  })

  it('instances with different amounts are not equal', () => {
    const a = unwrap(Money.create(100))
    const b = unwrap(Money.create(200))
    expect(a.equals(b)).toBe(false)
  })

  it('instances with different currencies are not equal', () => {
    const a = unwrap(Money.create(100, 'PKR'))
    const b = unwrap(Money.create(100, 'USD'))
    expect(a.equals(b)).toBe(false)
  })

  it('different VO classes with the same data are NOT equal', () => {
    class Quantity extends ValueObject<MoneyProps> {
      constructor(v: MoneyProps) { super(v) }
    }
    const money = unwrap(Money.create(100, 'PKR'))
    const qty = new Quantity({ amount: 100, currency: 'PKR' })
    expect(money.equals(qty as unknown as Money)).toBe(false)
  })
})

describe('ValueObject - immutability', () => {
  it('props are frozen after construction', () => {
    const money = unwrap(Money.create(50))
    const props = (money as unknown as { props: MoneyProps }).props
    expect(Object.isFrozen(props)).toBe(true)
  })

  it('mutating frozen props throws at runtime', () => {
    const money = unwrap(Money.create(50))
    const props = (money as unknown as { props: MoneyProps }).props
    expect(() => {
      Object.assign(props, { amount: 9999 })
    }).toThrow()
  })
})

describe('ValueObject - factory validation', () => {
  it('returns Ok for valid input', () => {
    const result = Money.create(500)
    expect(isOk(result)).toBe(true)
    expect(unwrap(result).amount).toBe(500)
  })

  it('returns Err for invalid input', () => {
    const result = Money.create(-1)
    expect(isErr(result)).toBe(true)
    if (isErr(result)) {
      expect(result.error).toBeInstanceOf(ValidationError)
    }
  })
})

describe('ValueObject - toString', () => {
  it('includes class name and props', () => {
    const money = unwrap(Money.create(42, 'PKR'))
    const str = money.toString()
    expect(str).toContain('Money')
    expect(str).toContain('42')
  })
})
