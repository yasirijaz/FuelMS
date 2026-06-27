import { err } from '@fuelms/core'
import type { Result, AppError } from '@fuelms/core'
import { ValidationError } from '@fuelms/core'
import type { IOperatingIncomeRepository } from '../../domain/repositories/IOperatingIncomeRepository'
import { OperatingIncomeId } from '../../domain/entities/OperatingIncome'
import type { OperatingIncome } from '../../domain/entities/OperatingIncome'
import {
  operatingIncomeListQuerySchema,
  recordOperatingIncomeInputSchema,
  voidOperatingIncomeInputSchema,
  type OperatingIncomeListQuery,
  type RecordOperatingIncomeInput,
  type VoidOperatingIncomeInput,
} from '../../domain'

export const INCOME_DEFAULT_ACTOR = 'owner'

export class ListOperatingIncomesService {
  constructor(private readonly repository: IOperatingIncomeRepository) {}

  async execute(query: OperatingIncomeListQuery = {}): Promise<Result<OperatingIncome[], AppError>> {
    const parsed = operatingIncomeListQuerySchema.safeParse(query)
    if (!parsed.success) {
      return err(new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid list query.'))
    }
    return this.repository.list(parsed.data)
  }
}

export class GetOperatingIncomeService {
  constructor(private readonly repository: IOperatingIncomeRepository) {}

  async execute(incomeId: string): Promise<Result<OperatingIncome, AppError>> {
    if (!incomeId.trim()) return err(new ValidationError('Income id is required.'))
    return this.repository.findById(OperatingIncomeId.fromPersisted(incomeId))
  }
}

export class RecordOperatingIncomeService {
  constructor(private readonly repository: IOperatingIncomeRepository) {}

  async execute(input: RecordOperatingIncomeInput): Promise<Result<OperatingIncome, AppError>> {
    const parsed = recordOperatingIncomeInputSchema.safeParse(input)
    if (!parsed.success) {
      return err(new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid income input.'))
    }
    if (parsed.data.paymentStatus === 'received' && !parsed.data.cashAccountId) {
      return err(new ValidationError('Cash account is required for received income.'))
    }
    return this.repository.record(parsed.data)
  }
}

export class VoidOperatingIncomeService {
  constructor(private readonly repository: IOperatingIncomeRepository) {}

  async execute(input: VoidOperatingIncomeInput): Promise<Result<OperatingIncome, AppError>> {
    const parsed = voidOperatingIncomeInputSchema.safeParse(input)
    if (!parsed.success) {
      return err(new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid void input.'))
    }
    return this.repository.void(parsed.data)
  }
}
