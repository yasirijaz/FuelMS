import type { FuelProductCode } from '@fuelms/shared'
import type { FuelTank } from '../../../Tanks/domain/entities/FuelTank'
import { milliLitresToLitres } from '../../../Inventory/domain/utils/quantity'
import type { FuelStockLevel } from '../types/DashboardSnapshot'

const PRODUCT_ORDER: FuelProductCode[] = ['diesel', 'petrol', 'hobc']

function computeFillPercent(bookMilliLitres: number, capacityMilliLitres: number): number {
  if (capacityMilliLitres <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((bookMilliLitres * 100) / capacityMilliLitres)))
}

export function aggregateTankLevelsByProduct(tanks: FuelTank[]): FuelStockLevel[] {
  const byProduct = new Map<FuelProductCode, { bookMilliLitres: number; capacityMilliLitres: number }>()

  for (const tank of tanks) {
    if (!tank.isActive) continue
    const existing = byProduct.get(tank.productCode) ?? {
      bookMilliLitres: 0,
      capacityMilliLitres: 0,
    }
    existing.bookMilliLitres += tank.bookMilliLitres
    existing.capacityMilliLitres += tank.capacityMilliLitres
    byProduct.set(tank.productCode, existing)
  }

  const levels: FuelStockLevel[] = []
  for (const productCode of PRODUCT_ORDER) {
    const agg = byProduct.get(productCode)
    if (!agg) continue
    levels.push({
      productCode,
      fillPercent: computeFillPercent(agg.bookMilliLitres, agg.capacityMilliLitres),
      capacityLitres: milliLitresToLitres(agg.capacityMilliLitres),
    })
  }

  return levels
}
