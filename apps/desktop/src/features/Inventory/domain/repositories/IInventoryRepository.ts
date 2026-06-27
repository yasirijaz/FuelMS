import type { Result, AppError } from '@fuelms/core'
import type { InventoryBatch } from '../entities/InventoryBatch'
import type { InventoryMovement } from '../entities/InventoryMovement'
import type { InventoryProductSummary } from '../entities/InventoryProductSummary'
import type {
  InventoryBatchListQuery,
  InventoryMovementListQuery,
} from '../validation/inventorySchemas'

export interface IInventoryRepository {
  productSummary(): Promise<Result<InventoryProductSummary[], AppError>>
  listBatches(query: InventoryBatchListQuery): Promise<Result<InventoryBatch[], AppError>>
  listMovements(query: InventoryMovementListQuery): Promise<Result<InventoryMovement[], AppError>>
}
