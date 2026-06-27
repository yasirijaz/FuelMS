import type { FuelProductCode } from '@fuelms/shared'

export type InventoryBatch = {
  id: string
  productCode: FuelProductCode
  receivedAt: Date
  quantityMilliLitres: number
  remainingMilliLitres: number
  unitCostMinorPerLitre: number
  valuationMinor: number
  supplierName?: string
  purchaseId?: string
}
