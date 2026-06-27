import { useState } from 'react'
import type { PurchaseListFilters } from '../types/PurchaseListItem'
import { usePurchaseList as usePurchaseListQuery } from './usePurchaseQueries'

const defaultFilters: PurchaseListFilters = {
  search: '',
  status: 'all',
}

export function usePurchaseList() {
  const [filters, setFilters] = useState<PurchaseListFilters>(defaultFilters)
  const query = usePurchaseListQuery(filters)

  return {
    filters,
    setFilters,
    items: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  }
}

export { purchaseQueryKeys } from '../purchaseModule'
