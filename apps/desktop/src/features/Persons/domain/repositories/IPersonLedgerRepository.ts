import type { Result, AppError } from '@fuelms/core'
import type { PersonLedgerBalance } from '../entities/PersonLedgerBalance'
import type { PersonLedgerEntry } from '../entities/PersonLedgerEntry'
import type {
  PersonLedgerBalanceListQuery,
  PersonLedgerEntryListQuery,
  RecordPersonBorrowInput,
  RecordPersonCollectLoanInput,
  RecordPersonLendInput,
  RecordPersonRepayBorrowedInput,
} from '../validation/personLedgerSchemas'

export interface IPersonLedgerRepository {
  listBalances(query: PersonLedgerBalanceListQuery): Promise<Result<PersonLedgerBalance[], AppError>>
  listEntries(query: PersonLedgerEntryListQuery): Promise<Result<PersonLedgerEntry[], AppError>>
  recordBorrow(input: RecordPersonBorrowInput): Promise<Result<PersonLedgerEntry, AppError>>
  recordRepayBorrowed(
    input: RecordPersonRepayBorrowedInput,
  ): Promise<Result<PersonLedgerEntry, AppError>>
  recordLend(input: RecordPersonLendInput): Promise<Result<PersonLedgerEntry, AppError>>
  recordCollectLoan(
    input: RecordPersonCollectLoanInput,
  ): Promise<Result<PersonLedgerEntry, AppError>>
}
