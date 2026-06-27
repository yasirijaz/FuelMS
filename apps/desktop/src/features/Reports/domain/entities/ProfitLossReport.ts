export type ProfitLossReport = {
  fromDate: Date
  toDate: Date
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
