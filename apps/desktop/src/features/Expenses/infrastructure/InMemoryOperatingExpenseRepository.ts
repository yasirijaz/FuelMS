import { ok, err } from '@fuelms/core'
import type { Result, AppError, NotFoundError } from '@fuelms/core'
import { ConflictError, NotFoundError as NotFound } from '@fuelms/core'
import { rupeesToMinor } from '@fuelms/shared'
import type { IOperatingExpenseRepository } from '../domain/repositories/IOperatingExpenseRepository'
import { OperatingExpenseId } from '../domain/entities/OperatingExpense'
import type { OperatingExpense } from '../domain/entities/OperatingExpense'
import type {
  OperatingExpenseListQuery,
  RecordOperatingExpenseInput,
  VoidOperatingExpenseInput,
} from '../domain/validation/expenseSchemas'

export class InMemoryOperatingExpenseRepository implements IOperatingExpenseRepository {
  private expenses: OperatingExpense[] = []
  private cashBalances = new Map<string, number>([
    ['cash-drawer-main', rupeesToMinor(200_000)],
    ['cash-bank-main', rupeesToMinor(500_000)],
  ])

  private getCashBalance(accountId: string): number {
    return this.cashBalances.get(accountId) ?? 0
  }

  private adjustCash(accountId: string, delta: number): Result<void, AppError> {
    const next = this.getCashBalance(accountId) + delta
    if (next < 0) {
      return err(
        new ConflictError(
          'INSUFFICIENT_CASH',
          'Selected cash account has insufficient balance or is inactive.',
        ),
      )
    }
    this.cashBalances.set(accountId, next)
    return ok(undefined)
  }

  async list(query: OperatingExpenseListQuery): Promise<Result<OperatingExpense[], AppError>> {
    let rows = [...this.expenses]
    if (query.status && query.status !== 'all') {
      rows = rows.filter((e) => e.status === query.status)
    }
    if (query.search) {
      const term = query.search.toLowerCase()
      rows = rows.filter(
        (e) =>
          e.payeeName.toLowerCase().includes(term) ||
          (e.reference?.toLowerCase().includes(term) ?? false) ||
          e.categoryCode.includes(term),
      )
    }
    rows.sort((a, b) => b.expenseDate.getTime() - a.expenseDate.getTime())
    return ok(rows)
  }

  async findById(id: OperatingExpenseId): Promise<Result<OperatingExpense, NotFoundError>> {
    const row = this.expenses.find((e) => e.id === id)
    if (!row) return err(new NotFound('OperatingExpense', OperatingExpenseId.toString(id)))
    return ok(row)
  }

  async record(input: RecordOperatingExpenseInput): Promise<Result<OperatingExpense, AppError>> {
    if (input.paymentStatus === 'paid') {
      if (!input.cashAccountId) {
        return err(new ConflictError('CASH_ACCOUNT_REQUIRED', 'Cash account is required.'))
      }
      const adjust = this.adjustCash(input.cashAccountId, -rupeesToMinor(input.amountRupees))
      if (!adjust.ok) return adjust
    }

    const now = new Date()
    const expense: OperatingExpense = {
      id: OperatingExpenseId.fromPersisted(`exp-${crypto.randomUUID()}`),
      expenseDate: new Date(input.expenseDateIso),
      categoryCode: input.categoryCode,
      amountMinor: rupeesToMinor(input.amountRupees),
      paymentStatus: input.paymentStatus,
      payeeName: input.payeeName.trim(),
      cashAccountId: input.paymentStatus === 'paid' ? input.cashAccountId : undefined,
      cashAccountName: input.paymentStatus === 'paid' ? 'Cash Drawer' : undefined,
      reference: input.reference?.trim(),
      notes: input.notes?.trim(),
      status: 'posted',
      recordedBy: 'owner',
      createdAt: now,
      updatedAt: now,
      version: 1,
    }
    this.expenses.unshift(expense)
    return ok(expense)
  }

  async void(input: VoidOperatingExpenseInput): Promise<Result<OperatingExpense, AppError>> {
    const index = this.expenses.findIndex(
      (e) => OperatingExpenseId.toString(e.id) === input.expenseId,
    )
    if (index < 0) return err(new NotFound('OperatingExpense', input.expenseId))
    const existing = this.expenses[index]!
    if (existing.status !== 'posted') {
      return err(new ConflictError('EXPENSE_NOT_POSTED', 'Only posted expenses can be voided.'))
    }
    if (existing.version !== input.version) {
      return err(
        new ConflictError(
          'EXPENSE_VERSION_CONFLICT',
          'Expense was modified by another process. Refresh and try again.',
        ),
      )
    }

    if (existing.paymentStatus === 'paid' && existing.cashAccountId) {
      const adjust = this.adjustCash(existing.cashAccountId, existing.amountMinor)
      if (!adjust.ok) return adjust
    }

    const updated: OperatingExpense = {
      ...existing,
      status: 'void',
      updatedAt: new Date(),
      version: existing.version + 1,
    }
    this.expenses[index] = updated
    return ok(updated)
  }
}
