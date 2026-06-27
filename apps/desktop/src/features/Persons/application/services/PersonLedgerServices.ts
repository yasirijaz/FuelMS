import { err } from '@fuelms/core'
import type { Result, AppError } from '@fuelms/core'
import { ValidationError } from '@fuelms/core'
import type { IPersonLedgerRepository } from '../../domain/repositories/IPersonLedgerRepository'
import type { PersonLedgerBalance } from '../../domain/entities/PersonLedgerBalance'
import type { PersonLedgerEntry } from '../../domain/entities/PersonLedgerEntry'
import {
  personLedgerBalanceListQuerySchema,
  personLedgerEntryListQuerySchema,
  recordPersonBorrowInputSchema,
  recordPersonCollectLoanInputSchema,
  recordPersonLendInputSchema,
  recordPersonRepayBorrowedInputSchema,
  type PersonLedgerBalanceListQuery,
  type PersonLedgerEntryListQuery,
  type RecordPersonBorrowInput,
  type RecordPersonCollectLoanInput,
  type RecordPersonLendInput,
  type RecordPersonRepayBorrowedInput,
} from '../../domain'

export const PERSON_LEDGER_DEFAULT_ACTOR = 'owner'

export class ListPersonLedgerBalancesService {
  constructor(private readonly repository: IPersonLedgerRepository) {}

  async execute(
    query: PersonLedgerBalanceListQuery = {},
  ): Promise<Result<PersonLedgerBalance[], AppError>> {
    const parsed = personLedgerBalanceListQuerySchema.safeParse(query)
    if (!parsed.success) {
      return err(new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid balance query.'))
    }
    return this.repository.listBalances(parsed.data)
  }
}

export class ListPersonLedgerEntriesService {
  constructor(private readonly repository: IPersonLedgerRepository) {}

  async execute(query: PersonLedgerEntryListQuery): Promise<Result<PersonLedgerEntry[], AppError>> {
    const parsed = personLedgerEntryListQuerySchema.safeParse(query)
    if (!parsed.success) {
      return err(new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid entry query.'))
    }
    return this.repository.listEntries(parsed.data)
  }
}

export class RecordPersonBorrowService {
  constructor(private readonly repository: IPersonLedgerRepository) {}

  async execute(input: RecordPersonBorrowInput): Promise<Result<PersonLedgerEntry, AppError>> {
    const parsed = recordPersonBorrowInputSchema.safeParse(input)
    if (!parsed.success) {
      return err(new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid borrow input.'))
    }
    return this.repository.recordBorrow(parsed.data)
  }
}

export class RecordPersonRepayBorrowedService {
  constructor(private readonly repository: IPersonLedgerRepository) {}

  async execute(
    input: RecordPersonRepayBorrowedInput,
  ): Promise<Result<PersonLedgerEntry, AppError>> {
    const parsed = recordPersonRepayBorrowedInputSchema.safeParse(input)
    if (!parsed.success) {
      return err(new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid repay input.'))
    }
    return this.repository.recordRepayBorrowed(parsed.data)
  }
}

export class RecordPersonLendService {
  constructor(private readonly repository: IPersonLedgerRepository) {}

  async execute(input: RecordPersonLendInput): Promise<Result<PersonLedgerEntry, AppError>> {
    const parsed = recordPersonLendInputSchema.safeParse(input)
    if (!parsed.success) {
      return err(new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid lend input.'))
    }
    return this.repository.recordLend(parsed.data)
  }
}

export class RecordPersonCollectLoanService {
  constructor(private readonly repository: IPersonLedgerRepository) {}

  async execute(
    input: RecordPersonCollectLoanInput,
  ): Promise<Result<PersonLedgerEntry, AppError>> {
    const parsed = recordPersonCollectLoanInputSchema.safeParse(input)
    if (!parsed.success) {
      return err(new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid collect input.'))
    }
    return this.repository.recordCollectLoan(parsed.data)
  }
}
