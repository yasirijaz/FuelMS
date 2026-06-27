import type { BackupId } from './BackupManifest'

export type RestoreBackupResult = {
  backupId: BackupId
  restoredAt: Date
  schemaVersion: number
  safetyCopyPath: string
  message: string
}
