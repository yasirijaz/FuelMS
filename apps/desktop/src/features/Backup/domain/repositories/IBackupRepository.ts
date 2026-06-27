import type { Result, AppError } from '@fuelms/core'
import type { BackupAuditEvent } from '../entities/BackupAuditEvent'
import type { BackupManifest } from '../entities/BackupManifest'
import { BackupId } from '../entities/BackupManifest'
import type { BackupVerifyResult } from '../entities/BackupVerifyResult'
import type { RestoreBackupResult } from '../entities/RestoreBackupResult'
import type {
  BackupAuditListQuery,
  CreateBackupInput,
  RestoreBackupInput,
} from '../validation/backupSchemas'

export interface IBackupRepository {
  listBackups(): Promise<Result<BackupManifest[], AppError>>
  createBackup(input: CreateBackupInput): Promise<Result<BackupManifest, AppError>>
  verifyBackup(id: BackupId): Promise<Result<BackupVerifyResult, AppError>>
  restoreBackup(input: RestoreBackupInput): Promise<Result<RestoreBackupResult, AppError>>
  listAuditEvents(query?: BackupAuditListQuery): Promise<Result<BackupAuditEvent[], AppError>>
  getStoragePath(): Promise<Result<string, AppError>>
}

export { BackupId }
