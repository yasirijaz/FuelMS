import { useQuery } from '@tanstack/react-query'
import type { FuelProductCode } from '@fuelms/shared'
import type { InventoryBatchListQuery, InventoryMovementListQuery } from '../../domain'
import {
  inventoryQueryKeys,
  listInventoryBatchesService,
  listInventoryMovementsService,
  productSummaryService,
} from '../inventoryModule'
import { mapBatchToUi, mapMovementToListItem, mapSummaryToUi } from '../mappers/inventoryViewMappers'

export function useInventorySummary() {
  return useQuery({
    queryKey: inventoryQueryKeys.summary(),
    queryFn: async () => {
      const result = await productSummaryService.execute()
      if (!result.ok) throw result.error
      return result.value.map(mapSummaryToUi)
    },
    staleTime: 30_000,
  })
}

export function useInventoryBatches(productCode?: FuelProductCode, activeOnly = true) {
  const query: InventoryBatchListQuery = { productCode, activeOnly }

  return useQuery({
    queryKey: inventoryQueryKeys.batchList(query),
    queryFn: async () => {
      const result = await listInventoryBatchesService.execute(query)
      if (!result.ok) throw result.error
      return result.value.map(mapBatchToUi)
    },
    staleTime: 30_000,
  })
}

export function useInventoryMovements(productCode?: FuelProductCode, limit = 50) {
  const query: InventoryMovementListQuery = { productCode, limit }

  return useQuery({
    queryKey: inventoryQueryKeys.movementList(query),
    queryFn: async () => {
      const result = await listInventoryMovementsService.execute(query)
      if (!result.ok) throw result.error
      return result.value.map(mapMovementToListItem)
    },
    staleTime: 30_000,
  })
}
