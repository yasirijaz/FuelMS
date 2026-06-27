import { ok, err } from '@fuelms/core'
import type { Result, AppError, NotFoundError } from '@fuelms/core'
import {
  NotFoundError as NotFound,
  ConflictError as Conflict,
  InfrastructureError,
} from '@fuelms/core'
import { env } from '@shared/lib/env'
import type { IBackupRepository } from '../domain/repositories/IBackupRepository'
import { BackupId } from '../domain/entities/BackupManifest'
import type { BackupAuditEvent } from '../domain/entities/BackupAuditEvent'
import type { BackupManifest } from '../domain/entities/BackupManifest'
import type { BackupVerifyResult } from '../domain/entities/BackupVerifyResult'
import type { RestoreBackupResult } from '../domain/entities/RestoreBackupResult'
import type {
  BackupAuditEventDto,
  BackupCommandResult,
  BackupManifestDto,
  BackupVerifyResultDto,
  RestoreBackupResultDto,
} from '../domain/dtos/BackupDtos'
import type {
  BackupAuditListQuery,
  CreateBackupInput,
  RestoreBackupInput,
} from '../domain/validation/backupSchemas'
import {
  mapBackupAuditEventDtoToDomain,
  mapBackupManifestDtoToDomain,
  mapBackupVerifyResultDtoToDomain,
  mapCreateBackupInputToDto,
  mapRestoreBackupInputToDto,
  mapRestoreBackupResultDtoToDomain,
} from '../domain/mappers/backupMappers'

function mapCommandError(e: { code: string; message: string; kind: string }): AppError {
  if (e.kind === 'not-found') return new NotFound('Backup', e.message)
  if (e.kind === 'conflict') return new Conflict(e.code, e.message)
  return new InfrastructureError(e.code, e.message)
}

async function loadInvoke() {
  if (!env.IS_TAURI) return null
  const { invoke } = await import('@tauri-apps/api/core')
  return invoke
}

async function invokeResult<T>(
  command: string,
  args?: Record<string, unknown>,
): Promise<Result<T, AppError>> {
  try {
    const invoke = await loadInvoke()
    if (!invoke) {
      return err(
        new InfrastructureError(
          'TAURI_UNAVAILABLE',
          'Tauri backend is not available. Run the desktop app with: pnpm tauri dev',
        ),
      )
    }
    const response = await invoke<BackupCommandResult<T>>(command, args)
    if (response.ok && response.value !== undefined) return ok(response.value)
    if (response.error) return err(mapCommandError(response.error))
    return err(new InfrastructureError('UNKNOWN', 'Command returned no value or error.'))
  } catch (caught) {
    return err(
      new InfrastructureError(
        'TAURI_INVOKE_FAILED',
        caught instanceof Error ? caught.message : String(caught),
        caught,
      ),
    )
  }
}

export class TauriBackupRepository implements IBackupRepository {
  async listBackups(): Promise<Result<BackupManifest[], AppError>> {
    const result = await invokeResult<BackupManifestDto[]>('backup_list')
    if (!result.ok) return result
    return ok(result.value.map(mapBackupManifestDtoToDomain))
  }

  async createBackup(input: CreateBackupInput): Promise<Result<BackupManifest, AppError>> {
    const result = await invokeResult<BackupManifestDto>('backup_create', {
      input: mapCreateBackupInputToDto(input),
    })
    if (!result.ok) return result
    return ok(mapBackupManifestDtoToDomain(result.value))
  }

  async verifyBackup(id: BackupId): Promise<Result<BackupVerifyResult, AppError>> {
    const result = await invokeResult<BackupVerifyResultDto>('backup_verify', {
      backupId: BackupId.toString(id),
    })
    if (!result.ok) return result as Result<BackupVerifyResult, NotFoundError>
    return ok(mapBackupVerifyResultDtoToDomain(result.value))
  }

  async restoreBackup(input: RestoreBackupInput): Promise<Result<RestoreBackupResult, AppError>> {
    const result = await invokeResult<RestoreBackupResultDto>('backup_restore', {
      input: mapRestoreBackupInputToDto(input),
    })
    if (!result.ok) return result
    return ok(mapRestoreBackupResultDtoToDomain(result.value))
  }

  async listAuditEvents(
    query: BackupAuditListQuery = {},
  ): Promise<Result<BackupAuditEvent[], AppError>> {
    const result = await invokeResult<BackupAuditEventDto[]>('backup_list_audit_events', {
      limit: query.limit,
    })
    if (!result.ok) return result
    return ok(result.value.map(mapBackupAuditEventDtoToDomain))
  }

  async getStoragePath(): Promise<Result<string, AppError>> {
    return invokeResult<string>('backup_get_storage_path')
  }
}
