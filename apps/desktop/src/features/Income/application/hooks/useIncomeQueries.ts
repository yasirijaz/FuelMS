import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { RecordOperatingIncomeInput, VoidOperatingIncomeInput } from '../../domain'
import {
  incomeQueryKeys,
  listOperatingIncomesService,
  recordOperatingIncomeService,
  voidOperatingIncomeService,
} from '../incomeModule'
import { mapIncomeToListItem } from '../types/IncomeListItem'
import type { IncomeListFilters } from '../types/IncomeListItem'
import { toIncomeListQuery } from '../types/IncomeListItem'

export function useIncomeList(filters: IncomeListFilters) {
  const query = toIncomeListQuery(filters)
  return useQuery({
    queryKey: incomeQueryKeys.list(query),
    queryFn: async () => {
      const result = await listOperatingIncomesService.execute(query)
      if (!result.ok) throw result.error
      return result.value.map(mapIncomeToListItem)
    },
    staleTime: 15_000,
  })
}

export function useRecordIncome() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: RecordOperatingIncomeInput) => {
      const result = await recordOperatingIncomeService.execute(input)
      if (!result.ok) throw result.error
      return mapIncomeToListItem(result.value)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: incomeQueryKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['cash'] })
    },
  })
}

export function useVoidIncome() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: VoidOperatingIncomeInput) => {
      const result = await voidOperatingIncomeService.execute(input)
      if (!result.ok) throw result.error
      return mapIncomeToListItem(result.value)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: incomeQueryKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['cash'] })
    },
  })
}
