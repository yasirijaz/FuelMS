import type { FuelProductCode } from '@fuelms/shared'
import { isFuelProductCode } from '@fuelms/shared'
import type { FuelPurchase } from '../../domain'
import type { PurchaseListItem, PurchaseListFilters } from '../types/PurchaseListItem'

export function mapPurchaseToListItem(purchase: FuelPurchase): PurchaseListItem {
  const productCode = isFuelProductCode(purchase.productCode)
    ? purchase.productCode
    : ('diesel' as FuelProductCode)

  return {
    id: purchase.id.toString(),
    purchaseDateIso: purchase.purchaseDate.toISOString(),
    supplierName: purchase.supplierName ?? '—',
    status: purchase.status,
    version: purchase.version,
    productCode,
    paymentStatus: purchase.paymentStatus,
    quantityLitres: purchase.quantityMilliLitres / 1000,
    totalCostMinor: purchase.totalCostMinor,
  }
}

export function toListQuery(filters: PurchaseListFilters) {
  return {
    search: filters.search.trim() || undefined,
    status: filters.status === 'all' ? undefined : filters.status,
  }
}
