import type { FuelProductCode } from '@fuelms/shared'

export type InventoryProductSummary = {
  productCode: FuelProductCode
  quantityMilliLitres: number
  valuationMinor: number
  batchCount: number
}
