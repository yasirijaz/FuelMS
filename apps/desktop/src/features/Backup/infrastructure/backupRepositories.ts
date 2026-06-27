import { env } from '@shared/lib/env'
import { InMemoryBackupRepository } from './InMemoryBackupRepository'
import { TauriBackupRepository } from './TauriBackupRepository'
import type { IBackupRepository } from '../domain/repositories/IBackupRepository'

function createBackupRepositories(): {
  backupRepository: IBackupRepository
  runtime: 'tauri' | 'browser'
} {
  if (env.IS_TAURI) {
    return { backupRepository: new TauriBackupRepository(), runtime: 'tauri' }
  }
  return { backupRepository: new InMemoryBackupRepository(), runtime: 'browser' }
}

const repositories = createBackupRepositories()

export const backupRepository = repositories.backupRepository
export const backupRepositoryRuntime = repositories.runtime
