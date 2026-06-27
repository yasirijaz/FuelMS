import { isFuelProductCode } from '@fuelms/shared'
import type {
  InventoryBatchDto,
  InventoryMovementDto,
  InventoryProductSummaryDto,
} from '../dtos/InventoryDtos'
import type { InventoryBatch } from '../entities/InventoryBatch'
import type { InventoryMovement, InventoryMovementKind } from '../entities/InventoryMovement'
import type { InventoryProductSummary } from '../entities/InventoryProductSummary'

function assertProductCode(code: string) {
  if (!isFuelProductCode(code)) {
    throw new Error(`Invalid fuel product code: ${code}`)
  }
  return code
}

function parseMovementKind(kind: string): InventoryMovementKind {
  return kind === 'consumption' ? 'consumption' : 'receipt'
}

export function mapInventoryProductSummaryDtoToDomain(
  dto: InventoryProductSummaryDto,
): InventoryProductSummary {
  return {
    productCode: assertProductCode(dto.productCode),
    quantityMilliLitres: dto.quantityMilliLitres,
    valuationMinor: dto.valuationMinor,
    batchCount: dto.batchCount,
  }
}

export function mapInventoryBatchDtoToDomain(dto: InventoryBatchDto): InventoryBatch {
  return {
    id: dto.id,
    productCode: assertProductCode(dto.productCode),
    receivedAt: new Date(dto.receivedAtIso),
    quantityMilliLitres: dto.quantityMilliLitres,
    remainingMilliLitres: dto.remainingMilliLitres,
    unitCostMinorPerLitre: dto.unitCostMinorPerLitre,
    valuationMinor: dto.valuationMinor,
    supplierName: dto.supplierName ?? undefined,
    purchaseId: dto.purchaseId ?? undefined,
  }
}

export function mapInventoryMovementDtoToDomain(dto: InventoryMovementDto): InventoryMovement {
  return {
    id: dto.id,
    kind: parseMovementKind(dto.kind),
    occurredAt: new Date(dto.occurredAtIso),
    productCode: assertProductCode(dto.productCode),
    quantityMilliLitres: dto.quantityMilliLitres,
    referenceLabel: dto.referenceLabel,
  }
}
