import { env } from '@shared/lib/env'
import { InMemoryReportsRepository } from './InMemoryReportsRepository'
import { TauriReportsRepository } from './TauriReportsRepository'

const repositories = env.IS_TAURI
  ? { reportsRepository: new TauriReportsRepository(), runtime: 'tauri' as const }
  : { reportsRepository: new InMemoryReportsRepository(), runtime: 'browser' as const }

export const reportsRepository = repositories.reportsRepository
export const reportsRepositoryRuntime = repositories.runtime
