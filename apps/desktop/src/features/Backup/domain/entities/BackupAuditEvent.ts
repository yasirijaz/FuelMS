export type BackupAuditEvent = {
  id: string
  eventType: string
  status: string
  backupId?: string
  backupPath?: string
  schemaVersion?: number
  databaseSha256?: string
  message?: string
  actor: string
  createdAt: Date
}
