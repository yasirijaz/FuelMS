export const INCOME_STATUSES = ['posted', 'void'] as const
export type IncomeStatus = (typeof INCOME_STATUSES)[number]

export function isIncomeStatus(value: string): value is IncomeStatus {
  return (INCOME_STATUSES as readonly string[]).includes(value)
}
