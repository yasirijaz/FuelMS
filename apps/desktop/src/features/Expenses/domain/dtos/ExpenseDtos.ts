import type { ExpenseCategory } from '../valueObjects/ExpenseCategory'
import type { ExpensePaymentStatus } from '../valueObjects/ExpensePaymentStatus'
import type { ExpenseStatus } from '../valueObjects/ExpenseStatus'

export type ExpenseCommandErrorDto = { code: string; message: string; kind: string }
export type ExpenseCommandResult<T> = { ok: boolean; value?: T; error?: ExpenseCommandErrorDto }

export type OperatingExpenseDto = {
  id: string
  expenseDateIso: string
  categoryCode: ExpenseCategory
  amountMinor: number
  paymentStatus: ExpensePaymentStatus
  payeeName: string
  cashAccountId?: string | null
  cashAccountName?: string | null
  reference?: string | null
  notes?: string | null
  status: ExpenseStatus
  recordedBy: string
  createdAtIso: string
  updatedAtIso: string
  version: number
}

export type OperatingExpenseListQueryDto = { search?: string; status?: string }
export type RecordOperatingExpenseInputDto = {
  expenseDateIso: string
  categoryCode: ExpenseCategory
  amountMinor: number
  paymentStatus: ExpensePaymentStatus
  payeeName: string
  cashAccountId?: string
  reference?: string
  notes?: string
  recordedBy: string
}
export type VoidOperatingExpenseInputDto = { expenseId: string; version: number }
