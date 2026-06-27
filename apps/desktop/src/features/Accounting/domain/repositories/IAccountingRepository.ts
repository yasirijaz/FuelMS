import type { Result, AppError, NotFoundError } from '@fuelms/core'
import type { AccountingPeriod } from '../entities/AccountingPeriod'
import type { JournalEntry } from '../entities/JournalEntry'
import { JournalEntryId } from '../entities/JournalEntry'
import type { LedgerAccount } from '../entities/LedgerAccount'
import { LedgerAccountId } from '../entities/LedgerAccount'
import type {
  AccountingPeriodVersionInput,
  JournalListQuery,
} from '../validation/accountingSchemas'

export interface IAccountingRepository {
  listLedgerAccounts(activeOnly?: boolean): Promise<Result<LedgerAccount[], AppError>>
  findLedgerAccountById(id: LedgerAccountId): Promise<Result<LedgerAccount, NotFoundError>>
  listJournalEntries(query: JournalListQuery): Promise<Result<JournalEntry[], AppError>>
  findJournalEntryById(id: JournalEntryId): Promise<Result<JournalEntry, NotFoundError>>
  listAccountingPeriods(): Promise<Result<AccountingPeriod[], AppError>>
  getCurrentAccountingPeriod(): Promise<Result<AccountingPeriod, AppError>>
  closeAccountingPeriod(input: AccountingPeriodVersionInput): Promise<Result<AccountingPeriod, AppError>>
  reopenAccountingPeriod(input: AccountingPeriodVersionInput): Promise<Result<AccountingPeriod, AppError>>
}
