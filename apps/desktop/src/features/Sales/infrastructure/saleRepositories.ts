import { env } from '@shared/lib/env'
import { InMemoryFuelSaleRepository } from './InMemoryFuelSaleRepository'
import { TauriFuelSaleRepository } from './TauriFuelSaleRepository'
import type { IFuelSaleRepository } from '../domain/repositories/IFuelSaleRepository'

function createFuelSaleRepositories(): {
  fuelSaleRepository: IFuelSaleRepository
  runtime: 'tauri' | 'browser'
} {
  if (env.IS_TAURI) {
    return {
      fuelSaleRepository: new TauriFuelSaleRepository(),
      runtime: 'tauri',
    }
  }

  return {
    fuelSaleRepository: new InMemoryFuelSaleRepository(),
    runtime: 'browser',
  }
}

const repositories = createFuelSaleRepositories()

export const fuelSaleRepository = repositories.fuelSaleRepository
export const fuelSaleRepositoryRuntime = repositories.runtime
