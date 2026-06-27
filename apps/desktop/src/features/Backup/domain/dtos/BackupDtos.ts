export type BackupCommandErrorDto = { code: string; message: string; kind: string }
export type BackupCommandResult<T> = {
  ok: boolean
  value?: T
  error?: BackupCommandErrorDto
}

export type BackupManifestDto = {
  backupId: string
  backupPath: string
  appVersion: string
  schemaVersion: number
  createdAtIso: string
  createdBy: string
  databaseSha256: string
  databaseSizeBytes: number
  fileCount: number
  isVerified: boolean
}

export type BackupVerifyResultDto = {
  backupId: string
  isValid: boolean
  schemaVersion: number
  databaseSha256: string
  message: string
}

export type CreateBackupInputDto = {
  actor: string
  notes?: string | null
}

export type RestoreBackupInputDto = {
  backupId: string
  actor: string
  acknowledgeReplace: boolean
}

export type RestoreBackupResultDto = {
  backupId: string
  restoredAtIso: string
  schemaVersion: number
  safetyCopyPath: string
  message: string
}

export type BackupAuditEventDto = {
  id: string
  eventType: string
  status: string
  backupId?: string | null
  backupPath?: string | null
  schemaVersion?: number | null
  databaseSha256?: string | null
  message?: string | null
  actor: string
  createdAtIso: string
}
