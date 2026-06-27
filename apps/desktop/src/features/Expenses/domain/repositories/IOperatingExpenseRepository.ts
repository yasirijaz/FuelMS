import type { Result, AppError, NotFoundError } from '@fuelms/core'
import type { OperatingExpense, OperatingExpenseId } from '../entities/OperatingExpense'
import type {
  OperatingExpenseListQuery,
  RecordOperatingExpenseInput,
  VoidOperatingExpenseInput,
} from '../validation/expenseSchemas'

export interface IOperatingExpenseRepository {
  list(query: OperatingExpenseListQuery): Promise<Result<OperatingExpense[], AppError>>
  findById(id: OperatingExpenseId): Promise<Result<OperatingExpense, NotFoundError>>
  record(input: RecordOperatingExpenseInput): Promise<Result<OperatingExpense, AppError>>
  void(input: VoidOperatingExpenseInput): Promise<Result<OperatingExpense, AppError>>
}
