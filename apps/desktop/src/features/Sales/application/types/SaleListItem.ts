import type { FuelProductCode } from '@fuelms/shared'
import {
  SALE_STATUSES,
  saleStatusLabel,
  type SaleStatus,
} from '../../domain/valueObjects/SaleStatus'
import {
  SALE_PAYMENT_METHODS,
  salePaymentMethodLabel,
  type SalePaymentMethod,
} from '../../domain/valueObjects/SalePaymentMethod'

export type SaleListItem = {
  id: string
  saleDateIso: string
  customerName: string
  status: SaleStatus
  version: number
  productCode: FuelProductCode
  productLabel: string
  paymentMethod: SalePaymentMethod
  quantityLitres: number
  quantityDisplay: string
  totalRevenueMinor: number
  totalRevenueDisplay: string
  notes: string | null
}

export type SaleListFilters = {
  search: string
  status: SaleStatus | 'all'
  fromDateIso: string
  toDateIso: string
}

export { SALE_STATUSES, type SaleStatus }

export const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
  draft: saleStatusLabel('draft'),
  posted: saleStatusLabel('posted'),
  void: saleStatusLabel('void'),
}

export { SALE_PAYMENT_METHODS, type SalePaymentMethod }

export const SALE_PAYMENT_METHOD_LABELS: Record<SalePaymentMethod, string> = {
  cash: salePaymentMethodLabel('cash'),
  credit: salePaymentMethodLabel('credit'),
  card: salePaymentMethodLabel('card'),
}
