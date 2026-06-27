export type PersonBalanceLine = {
  partnerId: string
  partnerName: string
  balanceMinor: number
  entryCount: number
}

export type PersonLedgerSummaryReport = {
  asOf: Date
  receivableTotalMinor: number
  payableTotalMinor: number
  lines: PersonBalanceLine[]
}
