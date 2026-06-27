import { describe, it, expect } from 'vitest'
import { UniqueId } from './UniqueId'

class OrderId extends UniqueId {
  static create(): OrderId { return new OrderId(UniqueId.generate().toString()) }
  static from(id: string): OrderId { return new OrderId(id) }
}

class InvoiceId extends UniqueId {
  static create(): InvoiceId { return new InvoiceId(UniqueId.generate().toString()) }
  static from(id: string): InvoiceId { return new InvoiceId(id) }
}

describe('UniqueId - generation', () => {
  it('generate() returns a non-empty string', () => {
    const id = UniqueId.generate()
    expect(id.toString().length).toBeGreaterThan(0)
  })

  it('two generated IDs are different', () => {
    const a = UniqueId.generate()
    const b = UniqueId.generate()
    expect(a.toString()).not.toBe(b.toString())
  })

  it('from() wraps an existing string', () => {
    const id = UniqueId.from('known-id-123')
    expect(id.toString()).toBe('known-id-123')
  })

  it('throws for empty string', () => {
    expect(() => UniqueId.from('')).toThrow('[UniqueId] Value cannot be empty')
  })

  it('throws for whitespace-only string', () => {
    expect(() => UniqueId.from('   ')).toThrow('[UniqueId] Value cannot be empty')
  })
})

describe('UniqueId - subclass generation', () => {
  it('OrderId.create() produces a valid typed ID', () => {
    const id = OrderId.create()
    expect(id.toString().length).toBeGreaterThan(0)
  })

  it('two created OrderIds are different', () => {
    const a = OrderId.create()
    const b = OrderId.create()
    expect(a.toString()).not.toBe(b.toString())
  })
})

describe('UniqueId - equality', () => {
  it('same class and same value are equal', () => {
    const a = OrderId.from('abc-123')
    const b = OrderId.from('abc-123')
    expect(a.equals(b)).toBe(true)
  })

  it('same class but different values are not equal', () => {
    const a = OrderId.from('abc-123')
    const b = OrderId.from('xyz-456')
    expect(a.equals(b)).toBe(false)
  })

  it('different classes with same value are NOT equal (typed identity)', () => {
    const order = OrderId.from('same-value')
    const invoice = InvoiceId.from('same-value')
    expect(order.equals(invoice as unknown as OrderId)).toBe(false)
  })
})

describe('UniqueId - serialization', () => {
  it('toString() returns the value', () => {
    const id = UniqueId.from('my-test-id')
    expect(id.toString()).toBe('my-test-id')
  })

  it('toJSON() returns the value (for JSON.stringify)', () => {
    const id = UniqueId.from('json-id')
    expect(JSON.stringify({ id })).toBe('{"id":"json-id"}')
  })
})
