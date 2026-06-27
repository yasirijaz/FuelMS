import {
  fuelPurchaseRepository,
  fuelPurchaseRepositoryRuntime,
} from '../infrastructure/purchaseRepositories'
import {
  GetPurchaseService,
  ListPurchasesService,
  PostPurchaseService,
  RecordPurchaseService,
  VoidPurchaseService,
} from './services/PurchaseServices'
import type { FuelPurchaseListQuery } from '../domain'

export const listPurchasesService = new ListPurchasesService(fuelPurchaseRepository)
export const getPurchaseService = new GetPurchaseService(fuelPurchaseRepository)
export const recordPurchaseService = new RecordPurchaseService(fuelPurchaseRepository)
export const postPurchaseService = new PostPurchaseService(fuelPurchaseRepository)
export const voidPurchaseService = new VoidPurchaseService(fuelPurchaseRepository)

export const purchaseQueryKeys = {
  all: ['purchases'] as const,
  lists: () => [...purchaseQueryKeys.all, 'list'] as const,
  list: (query: FuelPurchaseListQuery) => [...purchaseQueryKeys.lists(), query] as const,
  details: () => [...purchaseQueryKeys.all, 'detail'] as const,
  detail: (purchaseId: string) => [...purchaseQueryKeys.details(), purchaseId] as const,
}

export { fuelPurchaseRepositoryRuntime }
