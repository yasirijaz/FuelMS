import type { BackupAuditEventListItem } from '../../application/types/BackupViewTypes'

type AuditStatusBadgeProps = {
  status: string
  label: string
}

function AuditStatusBadge({ status, label }: AuditStatusBadgeProps) {
  const styles =
    status === 'completed'
      ? 'border-emerald-200 bg-emerald-100 text-emerald-900'
      : 'border-red-200 bg-red-100 text-red-900'

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles}`}
    >
      {label}
    </span>
  )
}

type BackupAuditTrailProps = {
  items: BackupAuditEventListItem[]
  isLoading: boolean
}

export function BackupAuditTrail({ items, isLoading }: BackupAuditTrailProps) {
  if (isLoading) {
    return (
      <div className="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-6 py-12 text-center text-sm text-[var(--ui-text-muted)]">
        Loading audit trail…
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[var(--ui-radius)] border border-dashed border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-6 py-12 text-center">
        <p className="text-sm font-medium text-[var(--ui-text)]">No backup events yet</p>
        <p className="mt-1 text-sm text-[var(--ui-text-muted)]">
          Create, verify, and restore actions are recorded here.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[var(--ui-radius)] border border-[var(--ui-border)]">
      <table className="min-w-full divide-y divide-[var(--ui-border)] text-sm">
        <thead className="bg-[var(--ui-surface-muted)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--ui-text-muted)]">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Event</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Backup</th>
            <th className="px-4 py-3">Actor</th>
            <th className="px-4 py-3">Message</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--ui-border)] bg-[var(--ui-surface)]">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-3 tabular-nums whitespace-nowrap">{item.createdAtDisplay}</td>
              <td className="px-4 py-3">{item.eventTypeLabel}</td>
              <td className="px-4 py-3">
                <AuditStatusBadge status={item.status} label={item.statusLabel} />
              </td>
              <td className="px-4 py-3 font-mono text-xs">{item.backupId ?? '—'}</td>
              <td className="px-4 py-3">{item.actor}</td>
              <td className="px-4 py-3 text-[var(--ui-text-muted)]">{item.message ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
