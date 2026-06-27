export type TrialBalanceLine = {
  accountCode: string
  accountName: string
  accountType: string
  balanceMinor: number
}

export type TrialBalanceReport = {
  asOf: Date
  lines: TrialBalanceLine[]
  totalDebitMinor: number
  totalCreditMinor: number
  isBalanced: boolean
}
