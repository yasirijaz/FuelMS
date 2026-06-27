import { env } from '@shared/lib/env'
import { InMemoryOperatingIncomeRepository } from './InMemoryOperatingIncomeRepository'
import { TauriOperatingIncomeRepository } from './TauriOperatingIncomeRepository'

const repositories = env.IS_TAURI
  ? { operatingIncomeRepository: new TauriOperatingIncomeRepository(), runtime: 'tauri' as const }
  : { operatingIncomeRepository: new InMemoryOperatingIncomeRepository(), runtime: 'browser' as const }

export const operatingIncomeRepository = repositories.operatingIncomeRepository
export const operatingIncomeRepositoryRuntime = repositories.runtime
