import type { FuelSale } from '../../domain'
import { isDateInRange } from '@shared/utils/dateInput'
import type { SalePaymentMethod } from '../../domain/valueObjects/SalePaymentMethod'

export type SalesPeriodPaymentBucket = {
  saleCount: number
  quantityLitres: number
  cashMinor: number
  cardMinor: number
  creditMinor: number
  /** Cash + card — money received at the pump, excluding customer credit. */
  netCashMinor: number
  totalRevenueMinor: number
}

export type SalesPeriodSummary = {
  fromDateIso: string
  toDateIso: string
  posted: SalesPeriodPaymentBucket
  draft: SalesPeriodPaymentBucket
}

const EMPTY_BUCKET: SalesPeriodPaymentBucket = {
  saleCount: 0,
  quantityLitres: 0,
  cashMinor: 0,
  cardMinor: 0,
  creditMinor: 0,
  netCashMinor: 0,
  totalRevenueMinor: 0,
}

function addSaleToBucket(bucket: SalesPeriodPaymentBucket, sale: FuelSale): void {
  bucket.saleCount += 1
  bucket.quantityLitres += sale.quantityMilliLitres / 1000
  bucket.totalRevenueMinor += sale.totalRevenueMinor

  switch (sale.paymentMethod as SalePaymentMethod) {
    case 'cash':
      bucket.cashMinor += sale.totalRevenueMinor
      bucket.netCashMinor += sale.totalRevenueMinor
      break
    case 'card':
      bucket.cardMinor += sale.totalRevenueMinor
      bucket.netCashMinor += sale.totalRevenueMinor
      break
    case 'credit':
      bucket.creditMinor += sale.totalRevenueMinor
      break
  }
}

function aggregateBucket(
  sales: FuelSale[],
  status: 'posted' | 'draft',
  fromDateIso: string,
  toDateIso: string,
): SalesPeriodPaymentBucket {
  const bucket: SalesPeriodPaymentBucket = { ...EMPTY_BUCKET }

  for (const sale of sales) {
    if (sale.status !== status) continue
    if (!isDateInRange(sale.saleDate.toISOString(), fromDateIso, toDateIso)) continue
    addSaleToBucket(bucket, sale)
  }

  return bucket
}

export function buildSalesPeriodSummary(
  sales: FuelSale[],
  fromDateIso: string,
  toDateIso: string,
): SalesPeriodSummary {
  return {
    fromDateIso,
    toDateIso,
    posted: aggregateBucket(sales, 'posted', fromDateIso, toDateIso),
    draft: aggregateBucket(sales, 'draft', fromDateIso, toDateIso),
  }
}

export function hasSalesPeriodActivity(summary: SalesPeriodSummary): boolean {
  return summary.posted.saleCount > 0 || summary.draft.saleCount > 0
}
