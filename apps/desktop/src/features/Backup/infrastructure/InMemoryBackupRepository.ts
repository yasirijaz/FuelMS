import { ok, err } from '@fuelms/core'
import type { Result, AppError } from '@fuelms/core'
import { InfrastructureError } from '@fuelms/core'
import type { IBackupRepository } from '../domain/repositories/IBackupRepository'
import { BackupId } from '../domain/entities/BackupManifest'
import type { BackupAuditEvent } from '../domain/entities/BackupAuditEvent'
import type { BackupManifest } from '../domain/entities/BackupManifest'
import type { BackupVerifyResult } from '../domain/entities/BackupVerifyResult'
import type { RestoreBackupResult } from '../domain/entities/RestoreBackupResult'
import type {
  BackupAuditListQuery,
  CreateBackupInput,
  RestoreBackupInput,
} from '../domain/validation/backupSchemas'

const DESKTOP_REQUIRED_MESSAGE =
  'Backup operations require the desktop app. Run pnpm tauri dev.'

export class InMemoryBackupRepository implements IBackupRepository {
  async listBackups(): Promise<Result<BackupManifest[], AppError>> {
    return ok([])
  }

  async createBackup(_input: CreateBackupInput): Promise<Result<BackupManifest, AppError>> {
    return err(new InfrastructureError('DESKTOP_REQUIRED', DESKTOP_REQUIRED_MESSAGE))
  }

  async verifyBackup(_id: BackupId): Promise<Result<BackupVerifyResult, AppError>> {
    return err(new InfrastructureError('DESKTOP_REQUIRED', DESKTOP_REQUIRED_MESSAGE))
  }

  async restoreBackup(_input: RestoreBackupInput): Promise<Result<RestoreBackupResult, AppError>> {
    return err(new InfrastructureError('DESKTOP_REQUIRED', DESKTOP_REQUIRED_MESSAGE))
  }

  async listAuditEvents(_query?: BackupAuditListQuery): Promise<Result<BackupAuditEvent[], AppError>> {
    return ok([])
  }

  async getStoragePath(): Promise<Result<string, AppError>> {
    return ok('Not available in browser preview — run pnpm tauri dev')
  }
}
