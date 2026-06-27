import { err } from '@fuelms/core'
import type { Result, AppError } from '@fuelms/core'
import { ValidationError } from '@fuelms/core'
import type { IInventoryRepository } from '../../domain/repositories/IInventoryRepository'
import type { InventoryBatch } from '../../domain/entities/InventoryBatch'
import type { InventoryMovement } from '../../domain/entities/InventoryMovement'
import type { InventoryProductSummary } from '../../domain/entities/InventoryProductSummary'
import {
  inventoryBatchListQuerySchema,
  inventoryMovementListQuerySchema,
  type InventoryBatchListQuery,
  type InventoryMovementListQuery,
} from '../../domain'

export class ProductSummaryService {
  constructor(private readonly repository: IInventoryRepository) {}

  async execute(): Promise<Result<InventoryProductSummary[], AppError>> {
    return this.repository.productSummary()
  }
}

export class ListInventoryBatchesService {
  constructor(private readonly repository: IInventoryRepository) {}

  async execute(query: InventoryBatchListQuery = {}): Promise<Result<InventoryBatch[], AppError>> {
    const parsed = inventoryBatchListQuerySchema.safeParse(query)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return err(new ValidationError(first?.message ?? 'Invalid batch list query.'))
    }

    return this.repository.listBatches(parsed.data)
  }
}

export class ListInventoryMovementsService {
  constructor(private readonly repository: IInventoryRepository) {}

  async execute(
    query: InventoryMovementListQuery = {},
  ): Promise<Result<InventoryMovement[], AppError>> {
    const parsed = inventoryMovementListQuerySchema.safeParse(query)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return err(new ValidationError(first?.message ?? 'Invalid movement list query.'))
    }

    return this.repository.listMovements(parsed.data)
  }
}
