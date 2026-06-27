import type { ExpenseCategory } from '../valueObjects/ExpenseCategory'
import type { ExpensePaymentStatus } from '../valueObjects/ExpensePaymentStatus'
import type { ExpenseStatus } from '../valueObjects/ExpenseStatus'

export type OperatingExpenseId = string & { readonly __brand: 'OperatingExpenseId' }
export const OperatingExpenseId = {
  fromPersisted(value: string): OperatingExpenseId {
    return value as OperatingExpenseId
  },
  toString(id: OperatingExpenseId): string {
    return id
  },
}

export type OperatingExpense = {
  id: OperatingExpenseId
  expenseDate: Date
  categoryCode: ExpenseCategory
  amountMinor: number
  paymentStatus: ExpensePaymentStatus
  payeeName: string
  cashAccountId?: string
  cashAccountName?: string
  reference?: string
  notes?: string
  status: ExpenseStatus
  recordedBy: string
  createdAt: Date
  updatedAt: Date
  version: number
}
