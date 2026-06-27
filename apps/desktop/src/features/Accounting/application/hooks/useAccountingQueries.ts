import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AccountingPeriodVersionInput, JournalListQuery } from '../../domain'
import {
  accountingQueryKeys,
  closeAccountingPeriodService,
  getCurrentAccountingPeriodService,
  getJournalEntryService,
  listJournalEntriesService,
  listLedgerAccountsService,
  reopenAccountingPeriodService,
} from '../accountingModule'
import {
  DEFAULT_JOURNAL_LIST_QUERY,
  mapAccountingPeriodToView,
  mapJournalEntryToListItem,
  mapLedgerAccountToListItem,
} from '../types/AccountingViewTypes'

export function useLedgerAccountList(activeOnly = true) {
  return useQuery({
    queryKey: accountingQueryKeys.accountList(activeOnly),
    queryFn: async () => {
      const result = await listLedgerAccountsService.execute(activeOnly)
      if (!result.ok) throw result.error
      return result.value.map(mapLedgerAccountToListItem)
    },
    staleTime: 15_000,
  })
}

export function useJournalList(query: JournalListQuery = DEFAULT_JOURNAL_LIST_QUERY) {
  return useQuery({
    queryKey: accountingQueryKeys.journalList(query),
    queryFn: async () => {
      const result = await listJournalEntriesService.execute(query)
      if (!result.ok) throw result.error
      return result.value.map(mapJournalEntryToListItem)
    },
    staleTime: 15_000,
  })
}

export function useJournalDetail(journalId: string | null) {
  return useQuery({
    queryKey: accountingQueryKeys.journalDetail(journalId ?? ''),
    queryFn: async () => {
      if (!journalId) throw new Error('Journal id is required.')
      const result = await getJournalEntryService.execute(journalId)
      if (!result.ok) throw result.error
      return result.value
    },
    enabled: Boolean(journalId),
    staleTime: 15_000,
  })
}

export function useCurrentAccountingPeriod() {
  return useQuery({
    queryKey: accountingQueryKeys.currentPeriod(),
    queryFn: async () => {
      const result = await getCurrentAccountingPeriodService.execute()
      if (!result.ok) throw result.error
      return mapAccountingPeriodToView(result.value)
    },
    staleTime: 15_000,
  })
}

export function useCloseAccountingPeriod() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: AccountingPeriodVersionInput) => {
      const result = await closeAccountingPeriodService.execute(input)
      if (!result.ok) throw result.error
      return mapAccountingPeriodToView(result.value)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountingQueryKeys.periods() })
    },
  })
}

export function useReopenAccountingPeriod() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: AccountingPeriodVersionInput) => {
      const result = await reopenAccountingPeriodService.execute(input)
      if (!result.ok) throw result.error
      return mapAccountingPeriodToView(result.value)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountingQueryKeys.periods() })
    },
  })
}
