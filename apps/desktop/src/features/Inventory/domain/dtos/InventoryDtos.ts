import type { FuelProductCode } from '@fuelms/shared'

export type InventoryCommandErrorDto = {
  code: string
  message: string
  kind: string
}

export type InventoryCommandResult<T> = {
  ok: boolean
  value?: T
  error?: InventoryCommandErrorDto
}

export type InventoryProductSummaryDto = {
  productCode: FuelProductCode
  quantityMilliLitres: number
  valuationMinor: number
  batchCount: number
}

export type InventoryBatchDto = {
  id: string
  productCode: FuelProductCode
  receivedAtIso: string
  quantityMilliLitres: number
  remainingMilliLitres: number
  unitCostMinorPerLitre: number
  valuationMinor: number
  supplierName?: string | null
  purchaseId?: string | null
}

export type InventoryBatchListQueryDto = {
  productCode?: FuelProductCode
  activeOnly?: boolean
}

export type InventoryMovementDto = {
  id: string
  kind: 'receipt' | 'consumption' | string
  occurredAtIso: string
  productCode: FuelProductCode
  quantityMilliLitres: number
  referenceLabel: string
}

export type InventoryMovementListQueryDto = {
  productCode?: FuelProductCode
  limit?: number
}
