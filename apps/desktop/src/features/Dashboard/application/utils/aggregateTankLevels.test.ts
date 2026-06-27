import { FuelTankId } from '../../../Tanks/domain/entities/FuelTank'
import type { FuelTank } from '../../../Tanks/domain/entities/FuelTank'
import { aggregateTankLevelsByProduct } from './aggregateTankLevels'

function tank(partial: Pick<FuelTank, 'productCode' | 'bookMilliLitres' | 'capacityMilliLitres'>): FuelTank {
  const now = new Date('2026-06-26T08:00:00.000Z')
  return {
    id: FuelTankId.fromPersisted(`tank-${partial.productCode}`),
    name: partial.productCode,
    productId: `product-${partial.productCode}`,
    productCode: partial.productCode,
    capacityMilliLitres: partial.capacityMilliLitres,
    isActive: true,
    displayOrder: 1,
    bookMilliLitres: partial.bookMilliLitres,
    fillPercent: 0,
    createdAt: now,
    updatedAt: now,
    version: 1,
  }
}

describe('aggregateTankLevelsByProduct', () => {
  it('sums active tanks per product and computes fill percent', () => {
    const levels = aggregateTankLevelsByProduct([
      tank({ productCode: 'diesel', bookMilliLitres: 5_000_000, capacityMilliLitres: 10_000_000 }),
      tank({ productCode: 'diesel', bookMilliLitres: 2_500_000, capacityMilliLitres: 20_000_000 }),
      tank({ productCode: 'petrol', bookMilliLitres: 1_000_000, capacityMilliLitres: 5_000_000 }),
    ])

    expect(levels).toEqual([
      { productCode: 'diesel', fillPercent: 25, capacityLitres: 30_000 },
      { productCode: 'petrol', fillPercent: 20, capacityLitres: 5_000 },
    ])
  })

  it('ignores inactive tanks', () => {
    const inactive = tank({
      productCode: 'hobc',
      bookMilliLitres: 5_000_000,
      capacityMilliLitres: 10_000_000,
    })
    inactive.isActive = false

    expect(aggregateTankLevelsByProduct([inactive])).toEqual([])
  })
})
