import { env } from '@shared/lib/env'
import { InMemoryPersonLedgerRepository } from './InMemoryPersonLedgerRepository'
import { TauriPersonLedgerRepository } from './TauriPersonLedgerRepository'

const repositories = env.IS_TAURI
  ? { personLedgerRepository: new TauriPersonLedgerRepository(), runtime: 'tauri' as const }
  : { personLedgerRepository: new InMemoryPersonLedgerRepository(), runtime: 'browser' as const }

export const personLedgerRepository = repositories.personLedgerRepository
export const personLedgerRepositoryRuntime = repositories.runtime
