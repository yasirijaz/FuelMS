import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { RecordFuelPriceInput, PriceHistoryFilter } from '../../domain/priceManagement'
import {
  cancelScheduledFuelPriceService,
  fuelPriceQueryKeys,
  getPriceHistoryService,
  listFuelPriceOverviewService,
  recordFuelPriceService,
} from '../fuelPriceModule'

export function useFuelPriceOverview() {
  return useQuery({
    queryKey: fuelPriceQueryKeys.overview,
    queryFn: async () => {
      const result = await listFuelPriceOverviewService.execute()
      if (!result.ok) throw result.error
      return result.value
    },
  })
}

export function useFuelPriceHistory(filter: PriceHistoryFilter) {
  return useQuery({
    queryKey: fuelPriceQueryKeys.history({ productCode: filter.productCode }),
    queryFn: async () => {
      const result = await getPriceHistoryService.execute(filter)
      if (!result.ok) throw result.error
      return result.value
    },
  })
}

export function useRecordFuelPrice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: RecordFuelPriceInput) => {
      const result = await recordFuelPriceService.execute(input)
      if (!result.ok) throw result.error
      return result.value
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: fuelPriceQueryKeys.all })
    },
  })
}

export function useCancelScheduledFuelPrice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (recordId: string) => {
      const result = await cancelScheduledFuelPriceService.execute(recordId)
      if (!result.ok) throw result.error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: fuelPriceQueryKeys.all })
    },
  })
}
