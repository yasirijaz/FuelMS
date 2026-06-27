import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  FuelPurchaseListQuery,
  PurchaseVersionInput,
  RecordFuelPurchaseInput,
} from '../../domain'
import {
  getPurchaseService,
  listPurchasesService,
  postPurchaseService,
  purchaseQueryKeys,
  recordPurchaseService,
  voidPurchaseService,
} from '../purchaseModule'
import type { PurchaseListFilters } from '../types/PurchaseListItem'
import { mapPurchaseToListItem, toListQuery } from '../services/purchaseViewMappers'

function invalidatePurchaseQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  purchaseId?: string,
): void {
  void queryClient.invalidateQueries({ queryKey: purchaseQueryKeys.all })
  if (purchaseId) {
    void queryClient.invalidateQueries({
      queryKey: purchaseQueryKeys.detail(purchaseId),
    })
  }
}

export function usePurchaseList(filters: PurchaseListFilters) {
  const query = toListQuery(filters)

  return useQuery({
    queryKey: purchaseQueryKeys.list(query),
    queryFn: async () => {
      const result = await listPurchasesService.execute(query)
      if (!result.ok) throw result.error
      return result.value.map(mapPurchaseToListItem)
    },
    staleTime: 30_000,
  })
}

export function usePurchaseListQuery(query: FuelPurchaseListQuery = {}) {
  return useQuery({
    queryKey: purchaseQueryKeys.list(query),
    queryFn: async () => {
      const result = await listPurchasesService.execute(query)
      if (!result.ok) throw result.error
      return result.value
    },
  })
}

export function usePurchase(purchaseId: string | null) {
  return useQuery({
    queryKey: purchaseQueryKeys.detail(purchaseId ?? ''),
    enabled: Boolean(purchaseId),
    queryFn: async () => {
      const result = await getPurchaseService.execute(purchaseId!)
      if (!result.ok) throw result.error
      return result.value
    },
  })
}

export function useRecordPurchase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: RecordFuelPurchaseInput) => {
      const result = await recordPurchaseService.execute(input)
      if (!result.ok) throw result.error
      return result.value
    },
    onSuccess: () => {
      invalidatePurchaseQueries(queryClient)
    },
  })
}

export function usePostPurchase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: PurchaseVersionInput) => {
      const result = await postPurchaseService.execute(input)
      if (!result.ok) throw result.error
      return result.value
    },
    onSuccess: (purchase) => {
      invalidatePurchaseQueries(queryClient, purchase.id.toString())
    },
  })
}

export function useVoidPurchase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: PurchaseVersionInput) => {
      const result = await voidPurchaseService.execute(input)
      if (!result.ok) throw result.error
      return result.value
    },
    onSuccess: (purchase) => {
      invalidatePurchaseQueries(queryClient, purchase.id.toString())
    },
  })
}
