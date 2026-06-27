import { env } from '@shared/lib/env'
import { InMemoryOperatingExpenseRepository } from './InMemoryOperatingExpenseRepository'
import { TauriOperatingExpenseRepository } from './TauriOperatingExpenseRepository'

const repositories = env.IS_TAURI
  ? { operatingExpenseRepository: new TauriOperatingExpenseRepository(), runtime: 'tauri' as const }
  : { operatingExpenseRepository: new InMemoryOperatingExpenseRepository(), runtime: 'browser' as const }

export const operatingExpenseRepository = repositories.operatingExpenseRepository
export const operatingExpenseRepositoryRuntime = repositories.runtime
