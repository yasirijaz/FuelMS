export type ReportCommandErrorDto = { code: string; message: string; kind: string }
export type ReportCommandResult<T> = { ok: boolean; value?: T; error?: ReportCommandErrorDto }

export type ReportDateRangeQueryDto = {
  fromDateIso: string
  toDateIso: string
}

export type ProfitLossReportDto = {
  fromDateIso: string
  toDateIso: string
  fuelSalesRevenueMinor: number
  fuelCogsMinor: number
  grossProfitMinor: number
  otherIncomeMinor: number
  operatingExpensesMinor: number
  netOperatingProfitMinor: number
  postedSaleCount: number
  postedExpenseCount: number
  postedIncomeCount: number
}

export type FuelSalesSummaryLineDto = {
  productCode: string
  saleCount: number
  quantityMilliLitres: number
  revenueMinor: number
  cogsMinor: number
  grossProfitMinor: number
}

export type FuelSalesSummaryReportDto = {
  fromDateIso: string
  toDateIso: string
  lines: FuelSalesSummaryLineDto[]
  totalRevenueMinor: number
  totalCogsMinor: number
  totalGrossProfitMinor: number
}

export type FuelProductLedgerLineDto = {
  occurredAtIso: string
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

export type FuelProductLedgerProductDto = {
  productCode: string
  stockMilliLitres: number
  periodRevenueMinor: number
  periodCogsMinor: number
  periodGrossProfitMinor: number
  allTimeRevenueMinor: number
  allTimeCogsMinor: number
  allTimeGrossProfitMinor: number
  lines: FuelProductLedgerLineDto[]
}

export type FuelProductLedgerReportDto = {
  fromDateIso: string
  toDateIso: string
  periodGrossProfitMinor: number
  allTimeGrossProfitMinor: number
  products: FuelProductLedgerProductDto[]
}

export type CashPositionLineDto = {
  accountId: string
  accountName: string
  accountType: string
  balanceMinor: number
}

export type CashPositionReportDto = {
  asOfIso: string
  lines: CashPositionLineDto[]
  totalBalanceMinor: number
}

export type PersonBalanceLineDto = {
  partnerId: string
  partnerName: string
  balanceMinor: number
  entryCount: number
}

export type PersonLedgerSummaryReportDto = {
  asOfIso: string
  receivableTotalMinor: number
  payableTotalMinor: number
  lines: PersonBalanceLineDto[]
}

export type TrialBalanceLineDto = {
  accountCode: string
  accountName: string
  accountType: string
  balanceMinor: number
}

export type TrialBalanceReportDto = {
  asOfIso: string
  lines: TrialBalanceLineDto[]
  totalDebitMinor: number
  totalCreditMinor: number
  isBalanced: boolean
}
