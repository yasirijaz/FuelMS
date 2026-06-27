import { ok, err } from '@fuelms/core'
import type { Result, AppError, NotFoundError } from '@fuelms/core'
import { ConflictError, NotFoundError as NotFound } from '@fuelms/core'
import { rupeesToMinor } from '@fuelms/shared'
import type { IOperatingIncomeRepository } from '../domain/repositories/IOperatingIncomeRepository'
import { OperatingIncomeId } from '../domain/entities/OperatingIncome'
import type { OperatingIncome } from '../domain/entities/OperatingIncome'
import type {
  OperatingIncomeListQuery,
  RecordOperatingIncomeInput,
  VoidOperatingIncomeInput,
} from '../domain/validation/incomeSchemas'

export class InMemoryOperatingIncomeRepository implements IOperatingIncomeRepository {
  private incomes: OperatingIncome[] = []
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

  async list(query: OperatingIncomeListQuery): Promise<Result<OperatingIncome[], AppError>> {
    let rows = [...this.incomes]
    if (query.status && query.status !== 'all') {
      rows = rows.filter((i) => i.status === query.status)
    }
    if (query.search) {
      const term = query.search.toLowerCase()
      rows = rows.filter(
        (i) =>
          i.sourceName.toLowerCase().includes(term) ||
          (i.reference?.toLowerCase().includes(term) ?? false) ||
          i.categoryCode.includes(term),
      )
    }
    rows.sort((a, b) => b.incomeDate.getTime() - a.incomeDate.getTime())
    return ok(rows)
  }

  async findById(id: OperatingIncomeId): Promise<Result<OperatingIncome, NotFoundError>> {
    const row = this.incomes.find((i) => i.id === id)
    if (!row) return err(new NotFound('OperatingIncome', OperatingIncomeId.toString(id)))
    return ok(row)
  }

  async record(input: RecordOperatingIncomeInput): Promise<Result<OperatingIncome, AppError>> {
    if (input.paymentStatus === 'received') {
      if (!input.cashAccountId) {
        return err(new ConflictError('CASH_ACCOUNT_REQUIRED', 'Cash account is required.'))
      }
      const adjust = this.adjustCash(input.cashAccountId, rupeesToMinor(input.amountRupees))
      if (!adjust.ok) return adjust
    }

    const now = new Date()
    const income: OperatingIncome = {
      id: OperatingIncomeId.fromPersisted(`inc-${crypto.randomUUID()}`),
      incomeDate: new Date(input.incomeDateIso),
      categoryCode: input.categoryCode,
      amountMinor: rupeesToMinor(input.amountRupees),
      paymentStatus: input.paymentStatus,
      sourceName: input.sourceName.trim(),
      cashAccountId: input.paymentStatus === 'received' ? input.cashAccountId : undefined,
      cashAccountName: input.paymentStatus === 'received' ? 'Cash Drawer' : undefined,
      reference: input.reference?.trim(),
      notes: input.notes?.trim(),
      status: 'posted',
      recordedBy: 'owner',
      createdAt: now,
      updatedAt: now,
      version: 1,
    }
    this.incomes.unshift(income)
    return ok(income)
  }

  async void(input: VoidOperatingIncomeInput): Promise<Result<OperatingIncome, AppError>> {
    const index = this.incomes.findIndex(
      (i) => OperatingIncomeId.toString(i.id) === input.incomeId,
    )
    if (index < 0) return err(new NotFound('OperatingIncome', input.incomeId))
    const existing = this.incomes[index]!
    if (existing.status !== 'posted') {
      return err(new ConflictError('INCOME_NOT_POSTED', 'Only posted income entries can be voided.'))
    }
    if (existing.version !== input.version) {
      return err(
        new ConflictError(
          'INCOME_VERSION_CONFLICT',
          'Income entry was modified by another process. Refresh and try again.',
        ),
      )
    }

    if (existing.paymentStatus === 'received' && existing.cashAccountId) {
      const adjust = this.adjustCash(existing.cashAccountId, -existing.amountMinor)
      if (!adjust.ok) return adjust
    }

    const updated: OperatingIncome = {
      ...existing,
      status: 'void',
      updatedAt: new Date(),
      version: existing.version + 1,
    }
    this.incomes[index] = updated
    return ok(updated)
  }
}
