import { formatMoneyDisplay } from '@fuelms/shared'
import type { OperatingExpense } from '../../domain/entities/OperatingExpense'
import { OperatingExpenseId } from '../../domain/entities/OperatingExpense'
import { expenseCategoryLabel } from '../../domain/valueObjects/ExpenseCategory'
import { expensePaymentStatusLabel } from '../../domain/valueObjects/ExpensePaymentStatus'

export type ExpenseListItem = {
  id: string
  expenseDateIso: string
  categoryCode: OperatingExpense['categoryCode']
  categoryLabel: string
  amountMinor: number
  amountDisplay: string
  paymentStatus: OperatingExpense['paymentStatus']
  paymentStatusLabel: string
  payeeName: string
  cashAccountName?: string
  reference?: string
  status: OperatingExpense['status']
  version: number
}

export function mapExpenseToListItem(expense: OperatingExpense): ExpenseListItem {
  return {
    id: OperatingExpenseId.toString(expense.id),
    expenseDateIso: expense.expenseDate.toISOString(),
    categoryCode: expense.categoryCode,
    categoryLabel: expenseCategoryLabel(expense.categoryCode),
    amountMinor: expense.amountMinor,
    amountDisplay: formatMoneyDisplay(expense.amountMinor),
    paymentStatus: expense.paymentStatus,
    paymentStatusLabel: expensePaymentStatusLabel(expense.paymentStatus),
    payeeName: expense.payeeName,
    cashAccountName: expense.cashAccountName,
    reference: expense.reference,
    status: expense.status,
    version: expense.version,
  }
}

export type ExpenseListFilters = {
  search: string
  status: 'posted' | 'void' | 'all'
}

export const DEFAULT_EXPENSE_LIST_FILTERS: ExpenseListFilters = {
  search: '',
  status: 'posted',
}

export function toExpenseListQuery(filters: ExpenseListFilters) {
  return {
    search: filters.search.trim() || undefined,
    status: filters.status,
  }
}
