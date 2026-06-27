import { describe, it, expect } from 'vitest'
import { unwrap, isOk, isErr } from '@fuelms/core'
import { PricePerLitre } from './valueObjects/PricePerLitre'
import { EffectiveDateTime } from './valueObjects/EffectiveDateTime'
import { FuelProductId } from './ids/FuelProductId'
import { FuelPriceRecord } from './entities/FuelPriceRecord'

describe('PricePerLitre', () => {
  it('creates from rupees with two decimal precision', () => {
    const price = unwrap(PricePerLitre.fromRupees(295))
    expect(price.minorPerLitre).toBe(29500)
    expect(price.toRupees()).toBe(295)
  })

  it('rejects zero and negative prices', () => {
    expect(isErr(PricePerLitre.fromRupees(0))).toBe(true)
    expect(isErr(PricePerLitre.fromRupees(-10))).toBe(true)
  })
})

describe('FuelPriceRecord', () => {
  const baseParams = {
    productId: FuelProductId.fromCode('diesel'),
    productCode: 'diesel' as const,
    pricePerLitre: unwrap(PricePerLitre.fromRupees(280)),
    recordedBy: 'owner',
  }

  it('creates an active record when effectiveFrom is now or past', () => {
    const effectiveFrom = unwrap(EffectiveDateTime.fromIso('2026-01-01T00:00:00.000Z'))
    const result = FuelPriceRecord.record({
      ...baseParams,
      effectiveFrom,
      asOf: new Date('2026-06-01T00:00:00.000Z'),
    })
    const record = unwrap(result)
    expect(record.status).toBe('active')
    expect(record.domainEventCount()).toBe(2)
  })

  it('creates a scheduled record when effectiveFrom is in the future', () => {
    const effectiveFrom = unwrap(EffectiveDateTime.fromIso('2026-12-31T23:59:00.000Z'))
    const result = FuelPriceRecord.record({
      ...baseParams,
      effectiveFrom,
      asOf: new Date('2026-06-01T00:00:00.000Z'),
    })
    const record = unwrap(result)
    expect(record.status).toBe('scheduled')
    expect(record.peekDomainEvents()[0]?.eventType).toBe('fuel.price.scheduled')
  })

  it('allows cancelling scheduled records only', () => {
    const effectiveFrom = unwrap(EffectiveDateTime.fromIso('2026-12-31T00:00:00.000Z'))
    const record = unwrap(
      FuelPriceRecord.record({
        ...baseParams,
        effectiveFrom,
        asOf: new Date('2026-06-01T00:00:00.000Z'),
      }),
    )
    expect(isOk(record.cancel())).toBe(true)
    expect(record.status).toBe('cancelled')
  })

  it('rejects cancel on active records', () => {
    const effectiveFrom = unwrap(EffectiveDateTime.fromIso('2026-01-01T00:00:00.000Z'))
    const record = unwrap(
      FuelPriceRecord.record({
        ...baseParams,
        effectiveFrom,
        asOf: new Date('2026-06-01T00:00:00.000Z'),
      }),
    )
    expect(isErr(record.cancel())).toBe(true)
  })
})
