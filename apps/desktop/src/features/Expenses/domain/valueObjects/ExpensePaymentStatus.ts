export const EXPENSE_PAYMENT_STATUSES = ['paid', 'credit'] as const
export type ExpensePaymentStatus = (typeof EXPENSE_PAYMENT_STATUSES)[number]

export function expensePaymentStatusLabel(status: ExpensePaymentStatus): string {
  return status === 'paid' ? 'Paid' : 'On credit'
}

export function isExpensePaymentStatus(value: string): value is ExpensePaymentStatus {
  return (EXPENSE_PAYMENT_STATUSES as readonly string[]).includes(value)
}
