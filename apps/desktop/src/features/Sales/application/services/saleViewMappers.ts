import type { FuelProductCode } from '@fuelms/shared'
import { formatFuelQuantity, formatMoneyDisplay, fuelProductDisplayName, isFuelProductCode } from '@fuelms/shared'
import type { FuelSale } from '../../domain'
import type { SaleListItem, SaleListFilters } from '../types/SaleListItem'

export function mapSaleToListItem(sale: FuelSale): SaleListItem {
  const productCode = isFuelProductCode(sale.productCode)
    ? sale.productCode
    : ('diesel' as FuelProductCode)

  return {
    id: sale.id.toString(),
    saleDateIso: sale.saleDate.toISOString(),
    customerName: sale.customerName ?? '—',
    status: sale.status,
    version: sale.version,
    productCode,
    productLabel: fuelProductDisplayName(productCode),
    paymentMethod: sale.paymentMethod,
    quantityLitres: sale.quantityMilliLitres / 1000,
    quantityDisplay: formatFuelQuantity(sale.quantityMilliLitres / 1000),
    totalRevenueMinor: sale.totalRevenueMinor,
    totalRevenueDisplay: formatMoneyDisplay(sale.totalRevenueMinor),
    notes: sale.notes,
  }
}

export function toListQuery(filters: SaleListFilters) {
  return {
    search: filters.search.trim() || undefined,
    status: filters.status === 'all' ? undefined : filters.status,
    fromDateIso: filters.fromDateIso,
    toDateIso: filters.toDateIso,
  }
}
