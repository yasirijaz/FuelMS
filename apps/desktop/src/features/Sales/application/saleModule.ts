import {
  fuelSaleRepository,
  fuelSaleRepositoryRuntime,
} from '../infrastructure/saleRepositories'
import {
  GetAvailableStockService,
  GetSaleService,
  ListSalesService,
  PostSaleService,
  RecordSaleService,
  VoidSaleService,
} from './services/SaleServices'
import { GetTodaySalesSummaryService } from './services/todaySalesSummary'
import type { FuelSaleListQuery } from '../domain'

export const listSalesService = new ListSalesService(fuelSaleRepository)
export const getSaleService = new GetSaleService(fuelSaleRepository)
export const getAvailableStockService = new GetAvailableStockService(fuelSaleRepository)
export const recordSaleService = new RecordSaleService(fuelSaleRepository)
export const postSaleService = new PostSaleService(fuelSaleRepository)
export const voidSaleService = new VoidSaleService(fuelSaleRepository)
export const getTodaySalesSummaryService = new GetTodaySalesSummaryService(fuelSaleRepository)

export const saleQueryKeys = {
  all: ['sales'] as const,
  lists: () => [...saleQueryKeys.all, 'list'] as const,
  list: (query: FuelSaleListQuery) => [...saleQueryKeys.lists(), query] as const,
  todaySummary: () => [...saleQueryKeys.all, 'todaySummary'] as const,
  details: () => [...saleQueryKeys.all, 'detail'] as const,
  detail: (saleId: string) => [...saleQueryKeys.details(), saleId] as const,
  stock: (productCode: string) => [...saleQueryKeys.all, 'stock', productCode] as const,
}

export { fuelSaleRepositoryRuntime }
