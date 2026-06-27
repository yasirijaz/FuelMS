import type { FuelProductCode } from '@fuelms/shared'
import {
  PURCHASE_STATUSES,
  purchaseStatusLabel,
  type PurchaseStatus,
} from '../../domain/valueObjects/PurchaseStatus'
import {
  PURCHASE_PAYMENT_STATUSES,
  purchasePaymentStatusLabel,
  type PurchasePaymentStatus,
} from '../../domain/valueObjects/PurchasePaymentStatus'

export type PurchaseListItem = {
  id: string
  purchaseDateIso: string
  supplierName: string
  status: PurchaseStatus
  version: number
  productCode: FuelProductCode
  paymentStatus: PurchasePaymentStatus
  quantityLitres: number
  totalCostMinor: number
}

export type PurchaseListFilters = {
  search: string
  status: PurchaseStatus | 'all'
}

export { PURCHASE_STATUSES, type PurchaseStatus }

export const PURCHASE_STATUS_LABELS: Record<PurchaseStatus, string> = {
  draft: purchaseStatusLabel('draft'),
  posted: purchaseStatusLabel('posted'),
  void: purchaseStatusLabel('void'),
}

export { PURCHASE_PAYMENT_STATUSES, type PurchasePaymentStatus }

export const PURCHASE_PAYMENT_STATUS_LABELS: Record<PurchasePaymentStatus, string> = {
  paid: purchasePaymentStatusLabel('paid'),
  credit: purchasePaymentStatusLabel('credit'),
}
