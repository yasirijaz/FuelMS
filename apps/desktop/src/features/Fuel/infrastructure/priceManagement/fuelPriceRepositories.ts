import { env } from '@shared/lib/env'
import type { IFuelProductRepository } from '../../domain/priceManagement/repositories/IFuelProductRepository'
import type { IFuelPriceRecordRepository } from '../../domain/priceManagement/repositories/IFuelPriceRecordRepository'
import {
  TauriFuelProductRepository,
  TauriFuelPriceRecordRepository,
} from './TauriFuelPriceRepositories'
import {
  InMemoryFuelProductRepository,
  InMemoryFuelPriceRecordRepository,
} from './InMemoryFuelPriceRepositories'

function createFuelPriceRepositories(): {
  productRepository: IFuelProductRepository
  priceRepository: IFuelPriceRecordRepository
  runtime: 'tauri' | 'browser'
} {
  if (env.IS_TAURI) {
    return {
      productRepository: new TauriFuelProductRepository(),
      priceRepository: new TauriFuelPriceRecordRepository(),
      runtime: 'tauri',
    }
  }

  return {
    productRepository: new InMemoryFuelProductRepository(),
    priceRepository: new InMemoryFuelPriceRecordRepository(),
    runtime: 'browser',
  }
}

const repositories = createFuelPriceRepositories()

export const fuelProductRepository = repositories.productRepository
export const fuelPriceRecordRepository = repositories.priceRepository
export const fuelPriceRepositoryRuntime = repositories.runtime
