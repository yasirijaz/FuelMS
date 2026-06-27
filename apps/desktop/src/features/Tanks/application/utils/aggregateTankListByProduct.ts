import type { FuelProductCode } from '@fuelms/shared'
import type { TankListItem } from '../mappers/tankViewMappers'

const PRODUCT_ORDER: FuelProductCode[] = ['diesel', 'petrol', 'hobc']

export type TankProductSummary = {
  productCode: FuelProductCode
  fillPercent: number
  capacityLitres: number
  currentLitres: number
  tankCount: number
}

function computeFillPercent(bookLitres: number, capacityLitres: number): number {
  if (capacityLitres <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((bookLitres * 100) / capacityLitres)))
}

export function aggregateTankListByProduct(tanks: TankListItem[]): TankProductSummary[] {
  const byProduct = new Map<
    FuelProductCode,
    { bookLitres: number; capacityLitres: number; tankCount: number }
  >()

  for (const tank of tanks) {
    if (!tank.isActive) continue
    const existing = byProduct.get(tank.productCode) ?? {
      bookLitres: 0,
      capacityLitres: 0,
      tankCount: 0,
    }
    existing.bookLitres += tank.bookLitres
    existing.capacityLitres += tank.capacityLitres
    existing.tankCount += 1
    byProduct.set(tank.productCode, existing)
  }

  return PRODUCT_ORDER.map((productCode) => {
    const agg = byProduct.get(productCode)
    if (!agg) {
      return {
        productCode,
        fillPercent: 0,
        capacityLitres: 0,
        currentLitres: 0,
        tankCount: 0,
      }
    }
    return {
      productCode,
      fillPercent: computeFillPercent(agg.bookLitres, agg.capacityLitres),
      capacityLitres: agg.capacityLitres,
      currentLitres: agg.bookLitres,
      tankCount: agg.tankCount,
    }
  })
}
