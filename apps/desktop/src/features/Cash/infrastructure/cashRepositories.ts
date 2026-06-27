import { env } from '@shared/lib/env'
import { InMemoryCashRepository } from './InMemoryCashRepository'
import { TauriCashRepository } from './TauriCashRepository'
import type { ICashRepository } from '../domain/repositories/ICashRepository'

function createCashRepositories(): {
  cashRepository: ICashRepository
  runtime: 'tauri' | 'browser'
} {
  if (env.IS_TAURI) {
    return { cashRepository: new TauriCashRepository(), runtime: 'tauri' }
  }
  return { cashRepository: new InMemoryCashRepository(), runtime: 'browser' }
}

const repositories = createCashRepositories()

export const cashRepository = repositories.cashRepository
export const cashRepositoryRuntime = repositories.runtime
