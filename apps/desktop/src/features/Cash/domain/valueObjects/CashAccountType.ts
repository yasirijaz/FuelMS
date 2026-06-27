export const CASH_ACCOUNT_TYPES = [
  'drawer',
  'bank',
  'safe',
  'mobile_wallet',
  'other',
] as const

export type CashAccountType = (typeof CASH_ACCOUNT_TYPES)[number]

export function isCashAccountType(value: string): value is CashAccountType {
  return (CASH_ACCOUNT_TYPES as readonly string[]).includes(value)
}

export function cashAccountTypeLabel(type: CashAccountType): string {
  switch (type) {
    case 'drawer':
      return 'Cash Drawer'
    case 'bank':
      return 'Bank'
    case 'safe':
      return 'Safe'
    case 'mobile_wallet':
      return 'Mobile Wallet'
    case 'other':
      return 'Other'
  }
}
