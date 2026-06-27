import type { FuelBatchSummary, FuelProductCode, InventoryProductSummary } from '@fuelms/shared'
import type { InventoryBatch } from '../../domain/entities/InventoryBatch'
import type { InventoryMovement } from '../../domain/entities/InventoryMovement'
import type { InventoryProductSummary as DomainSummary } from '../../domain/entities/InventoryProductSummary'
import { milliLitresToLitres } from '../../domain/utils/quantity'

export function mapSummaryToUi(summary: DomainSummary): InventoryProductSummary {
  return {
    productCode: summary.productCode,
    quantityLitres: milliLitresToLitres(summary.quantityMilliLitres),
    valuationMinor: summary.valuationMinor,
  }
}

export function mapBatchToUi(batch: InventoryBatch): FuelBatchSummary {
  return {
    id: batch.id,
    productCode: batch.productCode,
    receivedAtIso: batch.receivedAt.toISOString(),
    quantityLitres: milliLitresToLitres(batch.quantityMilliLitres),
    remainingLitres: milliLitresToLitres(batch.remainingMilliLitres),
    unitCostMinorPerLitre: batch.unitCostMinorPerLitre,
    supplierName: batch.supplierName,
  }
}

export type MovementListItem = {
  id: string
  kind: InventoryMovement['kind']
  occurredAtIso: string
  productCode: FuelProductCode
  quantityLitres: number
  referenceLabel: string
}

export function mapMovementToListItem(movement: InventoryMovement): MovementListItem {
  return {
    id: movement.id,
    kind: movement.kind,
    occurredAtIso: movement.occurredAt.toISOString(),
    productCode: movement.productCode,
    quantityLitres: milliLitresToLitres(movement.quantityMilliLitres),
    referenceLabel: movement.referenceLabel,
  }
}
