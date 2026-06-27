import { err } from '@fuelms/core'
import type { Result, AppError } from '@fuelms/core'
import { ValidationError } from '@fuelms/core'
import type { ICashRepository } from '../../domain/repositories/ICashRepository'
import { CashAccountId } from '../../domain/entities/CashAccount'
import type { CashAccount, CashTransfer } from '../../domain/entities/CashAccount'
import {
  cashTransferListQuerySchema,
  createCashAccountInputSchema,
  recordCashTransferInputSchema,
  cashAccountVersionInputSchema,
  updateCashAccountInputSchema,
  type CashAccountVersionInput,
  type CashTransferListQuery,
  type CreateCashAccountInput,
  type RecordCashTransferInput,
  type UpdateCashAccountInput,
} from '../../domain'

/** Default actor until authentication is introduced. */
export const CASH_DEFAULT_ACTOR = 'owner'

export class ListCashAccountsService {
  constructor(private readonly repository: ICashRepository) {}

  async execute(activeOnly = true): Promise<Result<CashAccount[], AppError>> {
    return this.repository.listAccounts(activeOnly)
  }
}

export class GetCashAccountService {
  constructor(private readonly repository: ICashRepository) {}

  async execute(accountId: string): Promise<Result<CashAccount, AppError>> {
    if (!accountId.trim()) {
      return err(new ValidationError('Account id is required.'))
    }
    return this.repository.findAccountById(CashAccountId.fromPersisted(accountId))
  }
}

export class CreateCashAccountService {
  constructor(private readonly repository: ICashRepository) {}

  async execute(input: CreateCashAccountInput): Promise<Result<CashAccount, AppError>> {
    const parsed = createCashAccountInputSchema.safeParse(input)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return err(new ValidationError(first?.message ?? 'Invalid account input.'))
    }
    return this.repository.createAccount(parsed.data)
  }
}

export class UpdateCashAccountService {
  constructor(private readonly repository: ICashRepository) {}

  async execute(input: UpdateCashAccountInput): Promise<Result<CashAccount, AppError>> {
    const parsed = updateCashAccountInputSchema.safeParse(input)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return err(new ValidationError(first?.message ?? 'Invalid account input.'))
    }
    return this.repository.updateAccount(parsed.data)
  }
}

export class ActivateCashAccountService {
  constructor(private readonly repository: ICashRepository) {}

  async execute(input: CashAccountVersionInput): Promise<Result<CashAccount, AppError>> {
    const parsed = cashAccountVersionInputSchema.safeParse(input)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return err(new ValidationError(first?.message ?? 'Invalid account version input.'))
    }
    return this.repository.activateAccount(parsed.data)
  }
}

export class DeactivateCashAccountService {
  constructor(private readonly repository: ICashRepository) {}

  async execute(input: CashAccountVersionInput): Promise<Result<CashAccount, AppError>> {
    const parsed = cashAccountVersionInputSchema.safeParse(input)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return err(new ValidationError(first?.message ?? 'Invalid account version input.'))
    }
    return this.repository.deactivateAccount(parsed.data)
  }
}

export class ListCashTransfersService {
  constructor(private readonly repository: ICashRepository) {}

  async execute(query: CashTransferListQuery = {}): Promise<Result<CashTransfer[], AppError>> {
    const parsed = cashTransferListQuerySchema.safeParse(query)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return err(new ValidationError(first?.message ?? 'Invalid transfer list query.'))
    }
    return this.repository.listTransfers(parsed.data)
  }
}

export class RecordCashTransferService {
  constructor(private readonly repository: ICashRepository) {}

  async execute(input: RecordCashTransferInput): Promise<Result<CashTransfer, AppError>> {
    const parsed = recordCashTransferInputSchema.safeParse(input)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return err(new ValidationError(first?.message ?? 'Invalid transfer input.'))
    }
    if (parsed.data.fromAccountId === parsed.data.toAccountId) {
      return err(new ValidationError('Source and destination must be different accounts.'))
    }
    return this.repository.recordTransfer(parsed.data)
  }
}
