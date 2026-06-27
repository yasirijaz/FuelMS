import {
  operatingExpenseRepository,
  operatingExpenseRepositoryRuntime,
} from '../infrastructure/expenseRepositories'
import {
  ListOperatingExpensesService,
  RecordOperatingExpenseService,
  VoidOperatingExpenseService,
} from './services/ExpenseServices'
import type { OperatingExpenseListQuery } from '../domain'

export const listOperatingExpensesService = new ListOperatingExpensesService(operatingExpenseRepository)
export const recordOperatingExpenseService = new RecordOperatingExpenseService(operatingExpenseRepository)
export const voidOperatingExpenseService = new VoidOperatingExpenseService(operatingExpenseRepository)

export const expenseQueryKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseQueryKeys.all, 'list'] as const,
  list: (query: OperatingExpenseListQuery) => [...expenseQueryKeys.lists(), query] as const,
}

export { operatingExpenseRepositoryRuntime }
