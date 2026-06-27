import { backupRepository, backupRepositoryRuntime } from '../infrastructure/backupRepositories'
import {
  BACKUP_DEFAULT_ACTOR,
  CreateBackupService,
  GetBackupStoragePathService,
  ListBackupAuditEventsService,
  ListBackupsService,
  RestoreBackupService,
  VerifyBackupService,
} from './services/BackupServices'
import type { BackupAuditListQuery, CreateBackupInput, RestoreBackupInput } from '../domain'

export const listBackupsService = new ListBackupsService(backupRepository)
export const createBackupService = new CreateBackupService(backupRepository)
export const verifyBackupService = new VerifyBackupService(backupRepository)
export const restoreBackupService = new RestoreBackupService(backupRepository)
export const listBackupAuditEventsService = new ListBackupAuditEventsService(backupRepository)
export const getBackupStoragePathService = new GetBackupStoragePathService(backupRepository)

export const backupQueryKeys = {
  all: ['backup'] as const,
  list: () => [...backupQueryKeys.all, 'list'] as const,
  storagePath: () => [...backupQueryKeys.all, 'storagePath'] as const,
  auditEvents: (query: BackupAuditListQuery) => [...backupQueryKeys.all, 'audit', query] as const,
}

export { backupRepositoryRuntime, BACKUP_DEFAULT_ACTOR }
export type { CreateBackupInput, RestoreBackupInput }
