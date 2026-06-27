import { describe, expect, it } from 'vitest'
import { filterPurchaseList } from '../services/getPurchaseList'
import type { PurchaseListItem } from '../types/PurchaseListItem'

const sampleItems: PurchaseListItem[] = [
  {
    id: 'fp-1',
    purchaseDateIso: '2026-06-20T00:00:00.000Z',
    supplierName: 'Ali Petroleum',
    status: 'posted',
    version: 1,
    productCode: 'diesel',
    paymentStatus: 'credit',
    quantityLitres: 1500,
    totalCostMinor: 428_250_000,
  },
  {
    id: 'fp-2',
    purchaseDateIso: '2026-06-22T00:00:00.000Z',
    supplierName: 'National Oil',
    status: 'draft',
    version: 1,
    productCode: 'petrol',
    paymentStatus: 'paid',
    quantityLitres: 800,
    totalCostMinor: 232_000_000,
  },
]

describe('filterPurchaseList', () => {
  it('filters by search text on supplier name', () => {
    const result = filterPurchaseList(sampleItems, {
      search: 'ali',
      status: 'all',
    })
    expect(result).toHaveLength(1)
    expect(result[0]?.supplierName).toBe('Ali Petroleum')
  })

  it('filters by status', () => {
    const result = filterPurchaseList(sampleItems, {
      search: '',
      status: 'draft',
    })
    expect(result).toHaveLength(1)
    expect(result[0]?.status).toBe('draft')
  })
})
