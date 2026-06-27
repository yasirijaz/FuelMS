import { env } from '@shared/lib/env'
import { InMemoryTankRepository } from './InMemoryTankRepository'
import { TauriTankRepository } from './TauriTankRepository'
import type { ITankRepository } from '../domain/repositories/ITankRepository'

function createTankRepositories(): {
  tankRepository: ITankRepository
  runtime: 'tauri' | 'browser'
} {
  if (env.IS_TAURI) {
    return {
      tankRepository: new TauriTankRepository(),
      runtime: 'tauri',
    }
  }

  return {
    tankRepository: new InMemoryTankRepository(),
    runtime: 'browser',
  }
}

const repositories = createTankRepositories()

export const tankRepository = repositories.tankRepository
export const tankRepositoryRuntime = repositories.runtime
