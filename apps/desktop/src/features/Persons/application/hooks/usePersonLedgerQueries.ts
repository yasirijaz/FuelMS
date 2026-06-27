import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  RecordPersonBorrowInput,
  RecordPersonCollectLoanInput,
  RecordPersonLendInput,
  RecordPersonRepayBorrowedInput,
} from '../../domain'
import {
  listPersonLedgerBalancesService,
  listPersonLedgerEntriesService,
  personLedgerQueryKeys,
  recordPersonBorrowService,
  recordPersonCollectLoanService,
  recordPersonLendService,
  recordPersonRepayBorrowedService,
} from '../personLedgerModule'
import {
  mapBalanceToListItem,
  mapEntryToListItem,
  toPersonLedgerBalanceQuery,
  type PersonLedgerBalanceFilters,
} from '../types/PersonLedgerViewTypes'

function invalidatePersonLedgerQueries(
  queryClient: ReturnType<typeof useQueryClient>,
): void {
  void queryClient.invalidateQueries({ queryKey: personLedgerQueryKeys.all })
  void queryClient.invalidateQueries({ queryKey: ['cash'] })
}

export function usePersonLedgerBalanceList(filters: PersonLedgerBalanceFilters) {
  const query = toPersonLedgerBalanceQuery(filters)
  return useQuery({
    queryKey: personLedgerQueryKeys.balanceList(query),
    queryFn: async () => {
      const result = await listPersonLedgerBalancesService.execute(query)
      if (!result.ok) throw result.error
      return result.value.map(mapBalanceToListItem)
    },
    staleTime: 15_000,
  })
}

export function usePersonLedgerEntryList(partnerId: string | null, limit = 100) {
  return useQuery({
    queryKey: personLedgerQueryKeys.entryList({ partnerId: partnerId ?? '', limit }),
    queryFn: async () => {
      const result = await listPersonLedgerEntriesService.execute({ partnerId: partnerId!, limit })
      if (!result.ok) throw result.error
      return result.value.map(mapEntryToListItem)
    },
    enabled: Boolean(partnerId),
    staleTime: 15_000,
  })
}

export function useRecordPersonBorrow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: RecordPersonBorrowInput) => {
      const result = await recordPersonBorrowService.execute(input)
      if (!result.ok) throw result.error
      return mapEntryToListItem(result.value)
    },
    onSuccess: () => invalidatePersonLedgerQueries(queryClient),
  })
}

export function useRecordPersonRepayBorrowed() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: RecordPersonRepayBorrowedInput) => {
      const result = await recordPersonRepayBorrowedService.execute(input)
      if (!result.ok) throw result.error
      return mapEntryToListItem(result.value)
    },
    onSuccess: () => invalidatePersonLedgerQueries(queryClient),
  })
}

export function useRecordPersonLend() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: RecordPersonLendInput) => {
      const result = await recordPersonLendService.execute(input)
      if (!result.ok) throw result.error
      return mapEntryToListItem(result.value)
    },
    onSuccess: () => invalidatePersonLedgerQueries(queryClient),
  })
}

export function useRecordPersonCollectLoan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: RecordPersonCollectLoanInput) => {
      const result = await recordPersonCollectLoanService.execute(input)
      if (!result.ok) throw result.error
      return mapEntryToListItem(result.value)
    },
    onSuccess: () => invalidatePersonLedgerQueries(queryClient),
  })
}
