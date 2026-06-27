export type BusinessPartnerOption = {
  id: string
  displayName: string
  roles?: string[]
}

export type PriceHistoryEntry = {
  id: string
  productCode: import('./fuel').FuelProductCode
  priceMinorPerLitre: number
  effectiveFromIso: string
  status: 'active' | 'scheduled' | 'superseded' | 'cancelled'
}

export type TransactionTimelineEntry = {
  id: string
  occurredAtIso: string
  title: string
  description?: string
  amountMinor?: number
  tone?: 'neutral' | 'credit' | 'debit'
}

export type FuelBatchSummary = {
  id: string
  productCode: import('./fuel').FuelProductCode
  receivedAtIso: string
  quantityLitres: number
  remainingLitres: number
  unitCostMinorPerLitre?: number
  supplierName?: string
}

export type InventoryProductSummary = {
  productCode: import('./fuel').FuelProductCode
  quantityLitres: number
  valuationMinor?: number
}
