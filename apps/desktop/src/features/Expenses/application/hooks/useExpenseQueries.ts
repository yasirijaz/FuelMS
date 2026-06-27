import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { RecordOperatingExpenseInput, VoidOperatingExpenseInput } from '../../domain'
import {
  expenseQueryKeys,
  listOperatingExpensesService,
  recordOperatingExpenseService,
  voidOperatingExpenseService,
} from '../expenseModule'
import { mapExpenseToListItem } from '../types/ExpenseListItem'
import type { ExpenseListFilters } from '../types/ExpenseListItem'
import { toExpenseListQuery } from '../types/ExpenseListItem'

export function useExpenseList(filters: ExpenseListFilters) {
  const query = toExpenseListQuery(filters)
  return useQuery({
    queryKey: expenseQueryKeys.list(query),
    queryFn: async () => {
      const result = await listOperatingExpensesService.execute(query)
      if (!result.ok) throw result.error
      return result.value.map(mapExpenseToListItem)
    },
    staleTime: 15_000,
  })
}

export function useRecordExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: RecordOperatingExpenseInput) => {
      const result = await recordOperatingExpenseService.execute(input)
      if (!result.ok) throw result.error
      return mapExpenseToListItem(result.value)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: expenseQueryKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['cash'] })
    },
  })
}

export function useVoidExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: VoidOperatingExpenseInput) => {
      const result = await voidOperatingExpenseService.execute(input)
      if (!result.ok) throw result.error
      return mapExpenseToListItem(result.value)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: expenseQueryKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['cash'] })
    },
  })
}
