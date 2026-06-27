import { ok } from '@fuelms/core'
import type { Result, AppError } from '@fuelms/core'
import type { IInventoryRepository } from '../domain/repositories/IInventoryRepository'
import type { InventoryBatch } from '../domain/entities/InventoryBatch'
import type { InventoryMovement } from '../domain/entities/InventoryMovement'
import type { InventoryProductSummary } from '../domain/entities/InventoryProductSummary'
import type {
  InventoryBatchListQuery,
  InventoryMovementListQuery,
} from '../domain/validation/inventorySchemas'

const SEED_BATCHES: InventoryBatch[] = [
  {
    id: 'batch-diesel-1',
    productCode: 'diesel',
    receivedAt: new Date('2026-06-20T08:00:00.000Z'),
    quantityMilliLitres: 10_000_000,
    remainingMilliLitres: 7_500_000,
    unitCostMinorPerLitre: 265_00,
    valuationMinor: 1_987_500_00,
    supplierName: 'Ali Petroleum',
    purchaseId: 'purchase-demo-1',
  },
  {
    id: 'batch-petrol-1',
    productCode: 'petrol',
    receivedAt: new Date('2026-06-22T09:30:00.000Z'),
    quantityMilliLitres: 5_000_000,
    remainingMilliLitres: 4_200_000,
    unitCostMinorPerLitre: 278_00,
    valuationMinor: 1_167_600_00,
    supplierName: 'National Oil Co',
    purchaseId: 'purchase-demo-2',
  },
]

const SEED_MOVEMENTS: InventoryMovement[] = [
  {
    id: 'mov-receipt-1',
    kind: 'receipt',
    occurredAt: new Date('2026-06-20T08:00:00.000Z'),
    productCode: 'diesel',
    quantityMilliLitres: 10_000_000,
    referenceLabel: 'Purchase purchase-demo-1',
  },
  {
    id: 'mov-consumption-1',
    kind: 'consumption',
    occurredAt: new Date('2026-06-23T14:15:00.000Z'),
    productCode: 'diesel',
    quantityMilliLitres: -2_500_000,
    referenceLabel: 'Sale sale-demo-1',
  },
  {
    id: 'mov-receipt-2',
    kind: 'receipt',
    occurredAt: new Date('2026-06-22T09:30:00.000Z'),
    productCode: 'petrol',
    quantityMilliLitres: 5_000_000,
    referenceLabel: 'Purchase purchase-demo-2',
  },
]

function buildSummary(batches: InventoryBatch[]): InventoryProductSummary[] {
  const byProduct = new Map<string, InventoryProductSummary>()

  for (const batch of batches) {
    if (batch.remainingMilliLitres <= 0) continue
    const existing = byProduct.get(batch.productCode)
    if (existing) {
      existing.quantityMilliLitres += batch.remainingMilliLitres
      existing.valuationMinor += batch.valuationMinor
      existing.batchCount += 1
    } else {
      byProduct.set(batch.productCode, {
        productCode: batch.productCode,
        quantityMilliLitres: batch.remainingMilliLitres,
        valuationMinor: batch.valuationMinor,
        batchCount: 1,
      })
    }
  }

  return ['petrol', 'diesel', 'hobc'].map((code) => {
    const summary = byProduct.get(code)
    return (
      summary ?? {
        productCode: code as InventoryProductSummary['productCode'],
        quantityMilliLitres: 0,
        valuationMinor: 0,
        batchCount: 0,
      }
    )
  })
}

export class InMemoryInventoryRepository implements IInventoryRepository {
  private batches = [...SEED_BATCHES]
  private movements = [...SEED_MOVEMENTS]

  async productSummary(): Promise<Result<InventoryProductSummary[], AppError>> {
    return ok(buildSummary(this.batches))
  }

  async listBatches(query: InventoryBatchListQuery): Promise<Result<InventoryBatch[], AppError>> {
    let rows = [...this.batches]
    if (query.productCode) {
      rows = rows.filter((batch) => batch.productCode === query.productCode)
    }
    if (query.activeOnly !== false) {
      rows = rows.filter((batch) => batch.remainingMilliLitres > 0)
    }
    rows.sort((a, b) => a.receivedAt.getTime() - b.receivedAt.getTime())
    return ok(rows)
  }

  async listMovements(
    query: InventoryMovementListQuery,
  ): Promise<Result<InventoryMovement[], AppError>> {
    let rows = [...this.movements]
    if (query.productCode) {
      rows = rows.filter((movement) => movement.productCode === query.productCode)
    }
    rows.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
    const limit = query.limit ?? 50
    return ok(rows.slice(0, limit))
  }
}
