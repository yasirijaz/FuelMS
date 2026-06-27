export type BackupId = string & { readonly __brand: 'BackupId' }
export const BackupId = {
  fromPersisted(value: string): BackupId {
    return value as BackupId
  },
  toString(id: BackupId): string {
    return id
  },
}

export type BackupManifest = {
  id: BackupId
  backupPath: string
  appVersion: string
  schemaVersion: number
  createdAt: Date
  createdBy: string
  databaseSha256: string
  databaseSizeBytes: number
  fileCount: number
  isVerified: boolean
}
