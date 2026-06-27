import { err } from '@fuelms/core'
import type { Result, AppError } from '@fuelms/core'
import { ValidationError } from '@fuelms/core'
import type { IAccountingRepository } from '../../domain/repositories/IAccountingRepository'
import type { AccountingPeriod } from '../../domain/entities/AccountingPeriod'
import { JournalEntryId } from '../../domain/entities/JournalEntry'
import type { JournalEntry } from '../../domain/entities/JournalEntry'
import { LedgerAccountId } from '../../domain/entities/LedgerAccount'
import type { LedgerAccount } from '../../domain/entities/LedgerAccount'
import {
  accountingPeriodVersionInputSchema,
  journalListQuerySchema,
  type AccountingPeriodVersionInput,
  type JournalListQuery,
} from '../../domain'

export const ACCOUNTING_DEFAULT_ACTOR = 'owner'

export class ListLedgerAccountsService {
  constructor(private readonly repository: IAccountingRepository) {}

  async execute(activeOnly = true): Promise<Result<LedgerAccount[], AppError>> {
    return this.repository.listLedgerAccounts(activeOnly)
  }
}

export class GetLedgerAccountService {
  constructor(private readonly repository: IAccountingRepository) {}

  async execute(accountId: string): Promise<Result<LedgerAccount, AppError>> {
    if (!accountId.trim()) return err(new ValidationError('Account id is required.'))
    return this.repository.findLedgerAccountById(LedgerAccountId.fromPersisted(accountId))
  }
}

export class ListJournalEntriesService {
  constructor(private readonly repository: IAccountingRepository) {}

  async execute(query: JournalListQuery = {}): Promise<Result<JournalEntry[], AppError>> {
    const parsed = journalListQuerySchema.safeParse(query)
    if (!parsed.success) {
      return err(new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid journal list query.'))
    }
    return this.repository.listJournalEntries(parsed.data)
  }
}

export class GetJournalEntryService {
  constructor(private readonly repository: IAccountingRepository) {}

  async execute(journalId: string): Promise<Result<JournalEntry, AppError>> {
    if (!journalId.trim()) return err(new ValidationError('Journal id is required.'))
    return this.repository.findJournalEntryById(JournalEntryId.fromPersisted(journalId))
  }
}

export class GetCurrentAccountingPeriodService {
  constructor(private readonly repository: IAccountingRepository) {}

  async execute(): Promise<Result<AccountingPeriod, AppError>> {
    return this.repository.getCurrentAccountingPeriod()
  }
}

export class CloseAccountingPeriodService {
  constructor(private readonly repository: IAccountingRepository) {}

  async execute(input: AccountingPeriodVersionInput): Promise<Result<AccountingPeriod, AppError>> {
    const parsed = accountingPeriodVersionInputSchema.safeParse(input)
    if (!parsed.success) {
      return err(new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid period input.'))
    }
    return this.repository.closeAccountingPeriod(parsed.data)
  }
}

export class ReopenAccountingPeriodService {
  constructor(private readonly repository: IAccountingRepository) {}

  async execute(input: AccountingPeriodVersionInput): Promise<Result<AccountingPeriod, AppError>> {
    const parsed = accountingPeriodVersionInputSchema.safeParse(input)
    if (!parsed.success) {
      return err(new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid period input.'))
    }
    return this.repository.reopenAccountingPeriod(parsed.data)
  }
}
