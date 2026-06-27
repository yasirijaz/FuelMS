import type {
  BackupAuditEventDto,
  BackupManifestDto,
  BackupVerifyResultDto,
  CreateBackupInputDto,
  RestoreBackupInputDto,
  RestoreBackupResultDto,
} from '../dtos/BackupDtos'
import type { BackupAuditEvent } from '../entities/BackupAuditEvent'
import type { BackupManifest } from '../entities/BackupManifest'
import { BackupId } from '../entities/BackupManifest'
import type { BackupVerifyResult } from '../entities/BackupVerifyResult'
import type { RestoreBackupResult } from '../entities/RestoreBackupResult'
import type { CreateBackupInput, RestoreBackupInput } from '../validation/backupSchemas'

export function mapBackupManifestDtoToDomain(dto: BackupManifestDto): BackupManifest {
  return {
    id: BackupId.fromPersisted(dto.backupId),
    backupPath: dto.backupPath,
    appVersion: dto.appVersion,
    schemaVersion: dto.schemaVersion,
    createdAt: new Date(dto.createdAtIso),
    createdBy: dto.createdBy,
    databaseSha256: dto.databaseSha256,
    databaseSizeBytes: dto.databaseSizeBytes,
    fileCount: dto.fileCount,
    isVerified: dto.isVerified,
  }
}

export function mapBackupVerifyResultDtoToDomain(dto: BackupVerifyResultDto): BackupVerifyResult {
  return {
    backupId: BackupId.fromPersisted(dto.backupId),
    isValid: dto.isValid,
    schemaVersion: dto.schemaVersion,
    databaseSha256: dto.databaseSha256,
    message: dto.message,
  }
}

export function mapRestoreBackupResultDtoToDomain(dto: RestoreBackupResultDto): RestoreBackupResult {
  return {
    backupId: BackupId.fromPersisted(dto.backupId),
    restoredAt: new Date(dto.restoredAtIso),
    schemaVersion: dto.schemaVersion,
    safetyCopyPath: dto.safetyCopyPath,
    message: dto.message,
  }
}

export function mapBackupAuditEventDtoToDomain(dto: BackupAuditEventDto): BackupAuditEvent {
  return {
    id: dto.id,
    eventType: dto.eventType,
    status: dto.status,
    backupId: dto.backupId ?? undefined,
    backupPath: dto.backupPath ?? undefined,
    schemaVersion: dto.schemaVersion ?? undefined,
    databaseSha256: dto.databaseSha256 ?? undefined,
    message: dto.message ?? undefined,
    actor: dto.actor,
    createdAt: new Date(dto.createdAtIso),
  }
}

export function mapCreateBackupInputToDto(input: CreateBackupInput): CreateBackupInputDto {
  return {
    actor: input.actor,
    notes: input.notes?.trim() || undefined,
  }
}

export function mapRestoreBackupInputToDto(input: RestoreBackupInput): RestoreBackupInputDto {
  return {
    backupId: input.backupId,
    actor: input.actor,
    acknowledgeReplace: true,
  }
}
