import { personLedgerRepository, personLedgerRepositoryRuntime } from '../infrastructure/personLedgerRepositories'
import {
  ListPersonLedgerBalancesService,
  ListPersonLedgerEntriesService,
  RecordPersonBorrowService,
  RecordPersonCollectLoanService,
  RecordPersonLendService,
  RecordPersonRepayBorrowedService,
} from './services/PersonLedgerServices'
import type { PersonLedgerBalanceListQuery, PersonLedgerEntryListQuery } from '../domain'

export const listPersonLedgerBalancesService = new ListPersonLedgerBalancesService(
  personLedgerRepository,
)
export const listPersonLedgerEntriesService = new ListPersonLedgerEntriesService(
  personLedgerRepository,
)
export const recordPersonBorrowService = new RecordPersonBorrowService(personLedgerRepository)
export const recordPersonRepayBorrowedService = new RecordPersonRepayBorrowedService(
  personLedgerRepository,
)
export const recordPersonLendService = new RecordPersonLendService(personLedgerRepository)
export const recordPersonCollectLoanService = new RecordPersonCollectLoanService(
  personLedgerRepository,
)

export const personLedgerQueryKeys = {
  all: ['person-ledger'] as const,
  balances: () => [...personLedgerQueryKeys.all, 'balances'] as const,
  balanceList: (query: PersonLedgerBalanceListQuery) =>
    [...personLedgerQueryKeys.balances(), query] as const,
  entries: () => [...personLedgerQueryKeys.all, 'entries'] as const,
  entryList: (query: PersonLedgerEntryListQuery) =>
    [...personLedgerQueryKeys.entries(), query] as const,
}

export { personLedgerRepositoryRuntime }
