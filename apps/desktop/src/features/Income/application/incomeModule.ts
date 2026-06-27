import {
  operatingIncomeRepository,
  operatingIncomeRepositoryRuntime,
} from '../infrastructure/incomeRepositories'
import {
  ListOperatingIncomesService,
  RecordOperatingIncomeService,
  VoidOperatingIncomeService,
} from './services/IncomeServices'
import type { OperatingIncomeListQuery } from '../domain'

export const listOperatingIncomesService = new ListOperatingIncomesService(operatingIncomeRepository)
export const recordOperatingIncomeService = new RecordOperatingIncomeService(operatingIncomeRepository)
export const voidOperatingIncomeService = new VoidOperatingIncomeService(operatingIncomeRepository)

export const incomeQueryKeys = {
  all: ['income'] as const,
  lists: () => [...incomeQueryKeys.all, 'list'] as const,
  list: (query: OperatingIncomeListQuery) => [...incomeQueryKeys.lists(), query] as const,
}

export { operatingIncomeRepositoryRuntime }
