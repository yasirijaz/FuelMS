import { env } from '@shared/lib/env'
import { InMemoryInventoryRepository } from './InMemoryInventoryRepository'
import { TauriInventoryRepository } from './TauriInventoryRepository'
import type { IInventoryRepository } from '../domain/repositories/IInventoryRepository'

function createInventoryRepositories(): {
  inventoryRepository: IInventoryRepository
  runtime: 'tauri' | 'browser'
} {
  if (env.IS_TAURI) {
    return {
      inventoryRepository: new TauriInventoryRepository(),
      runtime: 'tauri',
    }
  }

  return {
    inventoryRepository: new InMemoryInventoryRepository(),
    runtime: 'browser',
  }
}

const repositories = createInventoryRepositories()

export const inventoryRepository = repositories.inventoryRepository
export const inventoryRepositoryRuntime = repositories.runtime
