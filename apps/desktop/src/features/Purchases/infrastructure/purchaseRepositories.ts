import { env } from '@shared/lib/env'
import { InMemoryFuelPurchaseRepository } from './InMemoryFuelPurchaseRepository'
import { TauriFuelPurchaseRepository } from './TauriFuelPurchaseRepository'
import type { IFuelPurchaseRepository } from '../domain/repositories/IFuelPurchaseRepository'

function createFuelPurchaseRepositories(): {
  fuelPurchaseRepository: IFuelPurchaseRepository
  runtime: 'tauri' | 'browser'
} {
  if (env.IS_TAURI) {
    return {
      fuelPurchaseRepository: new TauriFuelPurchaseRepository(),
      runtime: 'tauri',
    }
  }

  return {
    fuelPurchaseRepository: new InMemoryFuelPurchaseRepository(),
    runtime: 'browser',
  }
}

const repositories = createFuelPurchaseRepositories()

export const fuelPurchaseRepository = repositories.fuelPurchaseRepository
export const fuelPurchaseRepositoryRuntime = repositories.runtime
