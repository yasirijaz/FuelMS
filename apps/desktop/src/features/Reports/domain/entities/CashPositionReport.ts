export type CashPositionLine = {
  accountId: string
  accountName: string
  accountType: string
  balanceMinor: number
}

export type CashPositionReport = {
  asOf: Date
  lines: CashPositionLine[]
  totalBalanceMinor: number
}
