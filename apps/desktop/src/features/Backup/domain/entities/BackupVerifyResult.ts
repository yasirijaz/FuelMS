import type { BackupId } from './BackupManifest'

export type BackupVerifyResult = {
  backupId: BackupId
  isValid: boolean
  schemaVersion: number
  databaseSha256: string
  message: string
}
