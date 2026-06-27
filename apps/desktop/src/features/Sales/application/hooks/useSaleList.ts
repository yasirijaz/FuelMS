import { useState } from 'react'
import { getMonthDateRange } from '@shared/utils/dateInput'
import type { SaleListFilters } from '../types/SaleListItem'
import { useSaleList as useSaleListQuery } from './useSaleQueries'

const defaultDateRange = getMonthDateRange()

const defaultFilters: SaleListFilters = {
  search: '',
  status: 'all',
  fromDateIso: defaultDateRange.fromDateIso,
  toDateIso: defaultDateRange.toDateIso,
}

export function useSaleListPage() {
  const [filters, setFilters] = useState<SaleListFilters>(defaultFilters)
  const query = useSaleListQuery(filters)

  return {
    filters,
    setFilters,
    items: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  }
}

export { saleQueryKeys } from '../saleModule'
