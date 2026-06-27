export type FuelSalesSummaryLine = {
  productCode: string
  saleCount: number
  quantityMilliLitres: number
  revenueMinor: number
  cogsMinor: number
  grossProfitMinor: number
}

export type FuelSalesSummaryReport = {
  fromDate: Date
  toDate: Date
  lines: FuelSalesSummaryLine[]
  totalRevenueMinor: number
  totalCogsMinor: number
  totalGrossProfitMinor: number
}
