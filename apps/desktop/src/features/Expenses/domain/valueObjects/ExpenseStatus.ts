export const EXPENSE_STATUSES = ['posted', 'void'] as const
export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number]

export function isExpenseStatus(value: string): value is ExpenseStatus {
  return (EXPENSE_STATUSES as readonly string[]).includes(value)
}
