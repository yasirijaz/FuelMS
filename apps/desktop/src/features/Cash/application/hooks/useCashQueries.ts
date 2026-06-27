import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CashTransferListQuery,
  CreateCashAccountInput,
  RecordCashTransferInput,
  UpdateCashAccountInput,
} from '../../domain'
import {
  cashQueryKeys,
  createCashAccountService,
  listCashAccountsService,
  listCashTransfersService,
  recordCashTransferService,
  updateCashAccountService,
} from '../cashModule'
import { mapAccountToListItem, mapTransferToListItem } from '../mappers/cashViewMappers'

function invalidateCashQueries(queryClient: ReturnType<typeof useQueryClient>): void {
  void queryClient.invalidateQueries({ queryKey: cashQueryKeys.all })
}

export function useCashAccountList(activeOnly = true) {
  return useQuery({
    queryKey: cashQueryKeys.accountList(activeOnly),
    queryFn: async () => {
      const result = await listCashAccountsService.execute(activeOnly)
      if (!result.ok) throw result.error
      return result.value.map(mapAccountToListItem)
    },
    staleTime: 15_000,
  })
}

export function useCashTransferList(query: CashTransferListQuery = { limit: 50 }) {
  return useQuery({
    queryKey: cashQueryKeys.transferList(query),
    queryFn: async () => {
      const result = await listCashTransfersService.execute(query)
      if (!result.ok) throw result.error
      return result.value.map(mapTransferToListItem)
    },
    staleTime: 15_000,
  })
}

export function useCreateCashAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateCashAccountInput) => {
      const result = await createCashAccountService.execute(input)
      if (!result.ok) throw result.error
      return mapAccountToListItem(result.value)
    },
    onSuccess: () => invalidateCashQueries(queryClient),
  })
}

export function useUpdateCashAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateCashAccountInput) => {
      const result = await updateCashAccountService.execute(input)
      if (!result.ok) throw result.error
      return mapAccountToListItem(result.value)
    },
    onSuccess: () => invalidateCashQueries(queryClient),
  })
}

export function useRecordCashTransfer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: RecordCashTransferInput) => {
      const result = await recordCashTransferService.execute(input)
      if (!result.ok) throw result.error
      return mapTransferToListItem(result.value)
    },
    onSuccess: () => invalidateCashQueries(queryClient),
  })
}
