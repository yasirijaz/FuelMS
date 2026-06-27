import type { PurchaseListFilters, PurchaseListItem } from '../types/PurchaseListItem'
import { listPurchasesService } from '../purchaseModule'
import { mapPurchaseToListItem, toListQuery } from './purchaseViewMappers'

export async function getPurchaseList(
  filters: PurchaseListFilters,
): Promise<PurchaseListItem[]> {
  const result = await listPurchasesService.execute(toListQuery(filters))
  if (!result.ok) {
    throw result.error
  }
  return result.value.map(mapPurchaseToListItem)
}

/** Client-side filter helper for tests and offline filtering. */
export function filterPurchaseList(
  items: PurchaseListItem[],
  filters: PurchaseListFilters,
): PurchaseListItem[] {
  const query = filters.search.trim().toLowerCase()

  return items.filter((item) => {
    if (filters.status !== 'all' && item.status !== filters.status) {
      return false
    }

    if (!query) return true

    return (
      item.supplierName.toLowerCase().includes(query) ||
      item.id.toLowerCase().includes(query)
    )
  })
}
