import { describe, expect, it } from 'vitest'
import { aggregateTankListByProduct } from './aggregateTankListByProduct'
import type { TankListItem } from '../mappers/tankViewMappers'

function tank(partial: Partial<TankListItem> & Pick<TankListItem, 'productCode'>): TankListItem {
  return {
    id: '1',
    name: 'Tank',
    capacityLitres: 10_000,
    bookLitres: 5_000,
    fillPercent: 50,
    isActive: true,
    displayOrder: 0,
    version: 1,
    ...partial,
  }
}

describe('aggregateTankListByProduct', () => {
  it('returns all three products in order with aggregated levels', () => {
    const result = aggregateTankListByProduct([
      tank({ id: 'd', productCode: 'diesel', bookLitres: 8_000, capacityLitres: 10_000 }),
      tank({ id: 'p', productCode: 'petrol', bookLitres: 2_500, capacityLitres: 5_000 }),
      tank({ id: 'h', productCode: 'hobc', bookLitres: 0, capacityLitres: 3_000 }),
    ])

    expect(result.map((item) => item.productCode)).toEqual(['diesel', 'petrol', 'hobc'])
    expect(result[0]?.fillPercent).toBe(80)
    expect(result[1]?.fillPercent).toBe(50)
    expect(result[2]?.fillPercent).toBe(0)
  })

  it('sums multiple tanks for the same product', () => {
    const result = aggregateTankListByProduct([
      tank({ id: 'd1', productCode: 'diesel', bookLitres: 3_000, capacityLitres: 10_000 }),
      tank({ id: 'd2', productCode: 'diesel', bookLitres: 2_000, capacityLitres: 10_000 }),
    ])

    expect(result[0]?.fillPercent).toBe(25)
    expect(result[0]?.tankCount).toBe(2)
  })

  it('ignores inactive tanks', () => {
    const result = aggregateTankListByProduct([
      tank({ productCode: 'diesel', isActive: false, bookLitres: 9_000 }),
    ])

    expect(result[0]?.fillPercent).toBe(0)
    expect(result[0]?.tankCount).toBe(0)
  })
})
