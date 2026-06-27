import type { FuelProductCode } from '@fuelms/shared'

export type InventoryMovementKind = 'receipt' | 'consumption'

export type InventoryMovement = {
  id: string
  kind: InventoryMovementKind
  occurredAt: Date
  productCode: FuelProductCode
  quantityMilliLitres: number
  referenceLabel: string
}
