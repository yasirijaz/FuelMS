import { err } from '@fuelms/core'
import type { Result, AppError } from '@fuelms/core'
import { ValidationError } from '@fuelms/core'
import type { IBackupRepository } from '../../domain/repositories/IBackupRepository'
import { BackupId } from '../../domain/entities/BackupManifest'
import type { BackupAuditEvent } from '../../domain/entities/BackupAuditEvent'
import type { BackupManifest } from '../../domain/entities/BackupManifest'
import type { BackupVerifyResult } from '../../domain/entities/BackupVerifyResult'
import type { RestoreBackupResult } from '../../domain/entities/RestoreBackupResult'
import {
  backupAuditListQuerySchema,
  createBackupInputSchema,
  restoreBackupInputSchema,
  type BackupAuditListQuery,
  type CreateBackupInput,
  type RestoreBackupInput,
} from '../../domain'

export const BACKUP_DEFAULT_ACTOR = 'owner'

export class ListBackupsService {
  constructor(private readonly repository: IBackupRepository) {}

  async execute(): Promise<Result<BackupManifest[], AppError>> {
    return this.repository.listBackups()
  }
}

export class CreateBackupService {
  constructor(private readonly repository: IBackupRepository) {}

  async execute(input: CreateBackupInput): Promise<Result<BackupManifest, AppError>> {
    const parsed = createBackupInputSchema.safeParse(input)
    if (!parsed.success) {
      return err(new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid backup input.'))
    }
    return this.repository.createBackup(parsed.data)
  }
}

export class VerifyBackupService {
  constructor(private readonly repository: IBackupRepository) {}

  async execute(backupId: string): Promise<Result<BackupVerifyResult, AppError>> {
    if (!backupId.trim()) return err(new ValidationError('Backup id is required.'))
    return this.repository.verifyBackup(BackupId.fromPersisted(backupId))
  }
}

export class RestoreBackupService {
  constructor(private readonly repository: IBackupRepository) {}

  async execute(input: RestoreBackupInput): Promise<Result<RestoreBackupResult, AppError>> {
    const parsed = restoreBackupInputSchema.safeParse(input)
    if (!parsed.success) {
      return err(new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid restore input.'))
    }
    return this.repository.restoreBackup(parsed.data)
  }
}

export class ListBackupAuditEventsService {
  constructor(private readonly repository: IBackupRepository) {}

  async execute(query: BackupAuditListQuery = {}): Promise<Result<BackupAuditEvent[], AppError>> {
    const parsed = backupAuditListQuerySchema.safeParse(query)
    if (!parsed.success) {
      return err(new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid audit query.'))
    }
    return this.repository.listAuditEvents(parsed.data)
  }
}

export class GetBackupStoragePathService {
  constructor(private readonly repository: IBackupRepository) {}

  async execute(): Promise<Result<string, AppError>> {
    return this.repository.getStoragePath()
  }
}
