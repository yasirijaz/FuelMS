export const INCOME_PAYMENT_STATUSES = ['received', 'credit'] as const
export type IncomePaymentStatus = (typeof INCOME_PAYMENT_STATUSES)[number]

export function incomePaymentStatusLabel(status: IncomePaymentStatus): string {
  return status === 'received' ? 'Received' : 'On credit'
}

export function isIncomePaymentStatus(value: string): value is IncomePaymentStatus {
  return (INCOME_PAYMENT_STATUSES as readonly string[]).includes(value)
}
