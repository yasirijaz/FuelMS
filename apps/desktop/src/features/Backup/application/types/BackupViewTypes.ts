import { formatDate } from '@shared/utils/format'
import type { BackupAuditEvent } from '../../domain/entities/BackupAuditEvent'
import type { BackupManifest } from '../../domain/entities/BackupManifest'
import { BackupId } from '../../domain/entities/BackupManifest'

export type BackupListItem = {
  id: string
  createdAtIso: string
  createdAtDisplay: string
  schemaVersion: number
  databaseSizeBytes: number
  sizeDisplay: string
  isVerified: boolean
  createdBy: string
}

export type BackupAuditEventListItem = {
  id: string
  eventType: string
  eventTypeLabel: string
  status: string
  statusLabel: string
  backupId?: string
  message?: string
  actor: string
  createdAtIso: string
  createdAtDisplay: string
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  backup: 'Backup',
  verify: 'Verify',
  restore: 'Restore',
}

const STATUS_LABELS: Record<string, string> = {
  completed: 'Completed',
  failed: 'Failed',
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  const decimals = exponent === 0 ? 0 : 1
  return `${value.toFixed(decimals)} ${units[exponent]}`
}

export function mapBackupToListItem(backup: BackupManifest): BackupListItem {
  return {
    id: BackupId.toString(backup.id),
    createdAtIso: backup.createdAt.toISOString(),
    createdAtDisplay: formatDate(backup.createdAt.toISOString()),
    schemaVersion: backup.schemaVersion,
    databaseSizeBytes: backup.databaseSizeBytes,
    sizeDisplay: formatBytes(backup.databaseSizeBytes),
    isVerified: backup.isVerified,
    createdBy: backup.createdBy,
  }
}

export function mapAuditEventToListItem(event: BackupAuditEvent): BackupAuditEventListItem {
  return {
    id: event.id,
    eventType: event.eventType,
    eventTypeLabel: EVENT_TYPE_LABELS[event.eventType] ?? event.eventType,
    status: event.status,
    statusLabel: STATUS_LABELS[event.status] ?? event.status,
    backupId: event.backupId,
    message: event.message,
    actor: event.actor,
    createdAtIso: event.createdAt.toISOString(),
    createdAtDisplay: formatDate(event.createdAt.toISOString()),
  }
}

export const DEFAULT_AUDIT_LIST_QUERY = { limit: 20 } as const
