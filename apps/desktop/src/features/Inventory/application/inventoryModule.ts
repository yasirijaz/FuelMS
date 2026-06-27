import {
  inventoryRepository,
  inventoryRepositoryRuntime,
} from '../infrastructure/inventoryRepositories'
import {
  ListInventoryBatchesService,
  ListInventoryMovementsService,
  ProductSummaryService,
} from './services/InventoryServices'
import type { InventoryBatchListQuery, InventoryMovementListQuery } from '../domain'

export const productSummaryService = new ProductSummaryService(inventoryRepository)
export const listInventoryBatchesService = new ListInventoryBatchesService(inventoryRepository)
export const listInventoryMovementsService = new ListInventoryMovementsService(inventoryRepository)

export const inventoryQueryKeys = {
  all: ['inventory'] as const,
  summary: () => [...inventoryQueryKeys.all, 'summary'] as const,
  batches: () => [...inventoryQueryKeys.all, 'batches'] as const,
  batchList: (query: InventoryBatchListQuery) =>
    [...inventoryQueryKeys.batches(), query] as const,
  movements: () => [...inventoryQueryKeys.all, 'movements'] as const,
  movementList: (query: InventoryMovementListQuery) =>
    [...inventoryQueryKeys.movements(), query] as const,
}

export { inventoryRepositoryRuntime }
