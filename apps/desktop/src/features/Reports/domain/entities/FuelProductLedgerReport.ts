export type FuelProductLedgerLine = {
  occurredAt: Date
  kind: 'purchase' | 'sale'
  referenceId: string
  label: string
  notes: string | null
  status: 'draft' | 'posted'
  quantityMilliLitres: number
  moneyInMinor: number
  moneyOutMinor: number
  grossProfitMinor: number
}

export type FuelProductLedgerProduct = {
  productCode: string
  stockMilliLitres: number
  periodRevenueMinor: number
  periodCogsMinor: number
  periodGrossProfitMinor: number
  allTimeRevenueMinor: number
  allTimeCogsMinor: number
  allTimeGrossProfitMinor: number
  lines: FuelProductLedgerLine[]
}

export type FuelProductLedgerReport = {
  fromDate: Date
  toDate: Date
  periodGrossProfitMinor: number
  allTimeGrossProfitMinor: number
  products: FuelProductLedgerProduct[]
}
