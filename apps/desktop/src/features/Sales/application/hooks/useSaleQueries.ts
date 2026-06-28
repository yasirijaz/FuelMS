import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { FuelProductCode } from '@fuelms/shared'
import type {
  FuelSaleListQuery,
  RecordFuelSaleInput,
  SaleVersionInput,
} from '../../domain'
import {
  getAvailableStockService,
  getSaleService,
  getTodaySalesSummaryService,
  listSalesService,
  postSaleService,
  recordSaleService,
  saleQueryKeys,
  voidSaleService,
} from '../saleModule'
import type { SaleListFilters } from '../types/SaleListItem'
import { mapSaleToListItem, toListQuery } from '../services/saleViewMappers'
import { buildSalesPeriodSummary } from '../services/salesPeriodSummary'

function invalidateSaleQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  saleId?: string,
): void {
  void queryClient.invalidateQueries({ queryKey: saleQueryKeys.all })
  void queryClient.invalidateQueries({ queryKey: saleQueryKeys.todaySummary() })
  if (saleId) {
    void queryClient.invalidateQueries({
      queryKey: saleQueryKeys.detail(saleId),
    })
  }
}

export function useSaleList(filters: SaleListFilters) {
  const query = toListQuery(filters)

  return useQuery({
    queryKey: saleQueryKeys.list(query),
    queryFn: async () => {
      const result = await listSalesService.execute(query)
      if (!result.ok) throw result.error
      return result.value.map(mapSaleToListItem)
    },
    staleTime: 30_000,
  })
}

export function useSalesPeriodSummary(fromDateIso: string, toDateIso: string) {
  return useQuery({
    queryKey: saleQueryKeys.periodSummary(fromDateIso, toDateIso),
    queryFn: async () => {
      const result = await listSalesService.execute({ fromDateIso, toDateIso })
      if (!result.ok) throw result.error
      return buildSalesPeriodSummary(result.value, fromDateIso, toDateIso)
    },
    staleTime: 30_000,
  })
}

export function useTodaySalesSummary() {
  return useQuery({
    queryKey: saleQueryKeys.todaySummary(),
    queryFn: async () => {
      const result = await getTodaySalesSummaryService.execute()
      if (!result.ok) throw result.error
      return result.value
    },
    staleTime: 30_000,
  })
}

export function useSaleListQuery(query: FuelSaleListQuery = {}) {
  return useQuery({
    queryKey: saleQueryKeys.list(query),
    queryFn: async () => {
      const result = await listSalesService.execute(query)
      if (!result.ok) throw result.error
      return result.value
    },
  })
}

export function useSale(saleId: string | null) {
  return useQuery({
    queryKey: saleQueryKeys.detail(saleId ?? ''),
    enabled: Boolean(saleId),
    queryFn: async () => {
      const result = await getSaleService.execute(saleId!)
      if (!result.ok) throw result.error
      return result.value
    },
  })
}

export function useAvailableStock(productCode: FuelProductCode | null) {
  return useQuery({
    queryKey: saleQueryKeys.stock(productCode ?? ''),
    enabled: Boolean(productCode),
    queryFn: async () => {
      const result = await getAvailableStockService.execute(productCode!)
      if (!result.ok) throw result.error
      return result.value
    },
    staleTime: 10_000,
  })
}

export function useRecordSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: RecordFuelSaleInput) => {
      const result = await recordSaleService.execute(input)
      if (!result.ok) throw result.error
      return result.value
    },
    onSuccess: () => {
      invalidateSaleQueries(queryClient)
    },
  })
}

export function usePostSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: SaleVersionInput) => {
      const result = await postSaleService.execute(input)
      if (!result.ok) throw result.error
      return result.value
    },
    onSuccess: (sale) => {
      invalidateSaleQueries(queryClient, sale.id.toString())
    },
  })
}

export function useVoidSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: SaleVersionInput) => {
      const result = await voidSaleService.execute(input)
      if (!result.ok) throw result.error
      return result.value
    },
    onSuccess: (sale) => {
      invalidateSaleQueries(queryClient, sale.id.toString())
    },
  })
}
