import { err } from '@fuelms/core'
import type { Result, AppError } from '@fuelms/core'
import { ValidationError } from '@fuelms/core'
import type { IOperatingExpenseRepository } from '../../domain/repositories/IOperatingExpenseRepository'
import { OperatingExpenseId } from '../../domain/entities/OperatingExpense'
import type { OperatingExpense } from '../../domain/entities/OperatingExpense'
import {
  operatingExpenseListQuerySchema,
  recordOperatingExpenseInputSchema,
  voidOperatingExpenseInputSchema,
  type OperatingExpenseListQuery,
  type RecordOperatingExpenseInput,
  type VoidOperatingExpenseInput,
} from '../../domain'

export const EXPENSE_DEFAULT_ACTOR = 'owner'

export class ListOperatingExpensesService {
  constructor(private readonly repository: IOperatingExpenseRepository) {}

  async execute(query: OperatingExpenseListQuery = {}): Promise<Result<OperatingExpense[], AppError>> {
    const parsed = operatingExpenseListQuerySchema.safeParse(query)
    if (!parsed.success) {
      return err(new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid list query.'))
    }
    return this.repository.list(parsed.data)
  }
}

export class GetOperatingExpenseService {
  constructor(private readonly repository: IOperatingExpenseRepository) {}

  async execute(expenseId: string): Promise<Result<OperatingExpense, AppError>> {
    if (!expenseId.trim()) return err(new ValidationError('Expense id is required.'))
    return this.repository.findById(OperatingExpenseId.fromPersisted(expenseId))
  }
}

export class RecordOperatingExpenseService {
  constructor(private readonly repository: IOperatingExpenseRepository) {}

  async execute(input: RecordOperatingExpenseInput): Promise<Result<OperatingExpense, AppError>> {
    const parsed = recordOperatingExpenseInputSchema.safeParse(input)
    if (!parsed.success) {
      return err(new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid expense input.'))
    }
    if (parsed.data.paymentStatus === 'paid' && !parsed.data.cashAccountId) {
      return err(new ValidationError('Cash account is required for paid expenses.'))
    }
    return this.repository.record(parsed.data)
  }
}

export class VoidOperatingExpenseService {
  constructor(private readonly repository: IOperatingExpenseRepository) {}

  async execute(input: VoidOperatingExpenseInput): Promise<Result<OperatingExpense, AppError>> {
    const parsed = voidOperatingExpenseInputSchema.safeParse(input)
    if (!parsed.success) {
      return err(new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid void input.'))
    }
    return this.repository.void(parsed.data)
  }
}
