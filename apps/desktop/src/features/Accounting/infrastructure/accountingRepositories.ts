import { env } from '@shared/lib/env'
import { InMemoryAccountingRepository } from './InMemoryAccountingRepository'
import { TauriAccountingRepository } from './TauriAccountingRepository'
import type { IAccountingRepository } from '../domain/repositories/IAccountingRepository'

function createAccountingRepositories(): {
  accountingRepository: IAccountingRepository
  runtime: 'tauri' | 'browser'
} {
  if (env.IS_TAURI) {
    return { accountingRepository: new TauriAccountingRepository(), runtime: 'tauri' }
  }
  return { accountingRepository: new InMemoryAccountingRepository(), runtime: 'browser' }
}

const repositories = createAccountingRepositories()

export const accountingRepository = repositories.accountingRepository
export const accountingRepositoryRuntime = repositories.runtime
