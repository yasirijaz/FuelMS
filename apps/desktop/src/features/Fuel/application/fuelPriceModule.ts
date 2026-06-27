import {
  fuelProductRepository,
  fuelPriceRecordRepository,
  fuelPriceRepositoryRuntime,
} from '../infrastructure/priceManagement/fuelPriceRepositories'
import {
  CancelScheduledFuelPriceService,
  GetPriceHistoryService,
  ListFuelPriceOverviewService,
  RecordFuelPriceService,
} from './services/FuelPriceServices'

export const listFuelPriceOverviewService = new ListFuelPriceOverviewService(
  fuelProductRepository,
  fuelPriceRecordRepository,
)

export const getPriceHistoryService = new GetPriceHistoryService(
  fuelProductRepository,
  fuelPriceRecordRepository,
)

export const recordFuelPriceService = new RecordFuelPriceService(
  fuelProductRepository,
  fuelPriceRecordRepository,
)

export const cancelScheduledFuelPriceService = new CancelScheduledFuelPriceService(
  fuelPriceRecordRepository,
)

export const fuelPriceQueryKeys = {
  all: ['fuel-prices'] as const,
  overview: ['fuel-prices', 'overview'] as const,
  history: (filter: { productCode?: string }) =>
    ['fuel-prices', 'history', filter] as const,
}

export { fuelPriceRepositoryRuntime }
