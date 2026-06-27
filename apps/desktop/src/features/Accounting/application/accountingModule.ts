import { accountingRepository, accountingRepositoryRuntime } from '../infrastructure/accountingRepositories'
import {
  CloseAccountingPeriodService,
  GetCurrentAccountingPeriodService,
  GetJournalEntryService,
  ListJournalEntriesService,
  ListLedgerAccountsService,
  ReopenAccountingPeriodService,
} from './services/AccountingServices'
import type { JournalListQuery } from '../domain'

export const listLedgerAccountsService = new ListLedgerAccountsService(accountingRepository)
export const getJournalEntryService = new GetJournalEntryService(accountingRepository)
export const listJournalEntriesService = new ListJournalEntriesService(accountingRepository)
export const getCurrentAccountingPeriodService = new GetCurrentAccountingPeriodService(accountingRepository)
export const closeAccountingPeriodService = new CloseAccountingPeriodService(accountingRepository)
export const reopenAccountingPeriodService = new ReopenAccountingPeriodService(accountingRepository)

export const accountingQueryKeys = {
  all: ['accounting'] as const,
  accounts: () => [...accountingQueryKeys.all, 'accounts'] as const,
  accountList: (activeOnly: boolean) => [...accountingQueryKeys.accounts(), { activeOnly }] as const,
  journals: () => [...accountingQueryKeys.all, 'journals'] as const,
  journalList: (query: JournalListQuery) => [...accountingQueryKeys.journals(), query] as const,
  journalDetail: (journalId: string) => [...accountingQueryKeys.journals(), 'detail', journalId] as const,
  periods: () => [...accountingQueryKeys.all, 'periods'] as const,
  currentPeriod: () => [...accountingQueryKeys.periods(), 'current'] as const,
}

export { accountingRepositoryRuntime }
