import { Button } from '@fuelms/ui'
import type { BackupListItem } from '../../application/types/BackupViewTypes'

type VerifiedBadgeProps = {
  isVerified: boolean
}

function VerifiedBadge({ isVerified }: VerifiedBadgeProps) {
  const styles = isVerified
    ? 'border-emerald-200 bg-emerald-100 text-emerald-900'
    : 'border-amber-200 bg-amber-100 text-amber-900'

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles}`}
    >
      {isVerified ? 'Verified' : 'Unverified'}
    </span>
  )
}

type BackupListTableProps = {
  items: BackupListItem[]
  isLoading: boolean
  pendingBackupId: string | null
  onVerify: (backupId: string) => void
  onRestore: (backupId: string) => void
}

export function BackupListTable({
  items,
  isLoading,
  pendingBackupId,
  onVerify,
  onRestore,
}: BackupListTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-6 py-12 text-center text-sm text-[var(--ui-text-muted)]">
        Loading backups…
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[var(--ui-radius)] border border-dashed border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-6 py-12 text-center">
        <p className="text-sm font-medium text-[var(--ui-text)]">No backups yet</p>
        <p className="mt-1 text-sm text-[var(--ui-text-muted)]">
          Create a backup to protect your business data offline.
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
            <th className="px-4 py-3">Schema</th>
            <th className="px-4 py-3">Size</th>
            <th className="px-4 py-3">Verified</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--ui-border)] bg-[var(--ui-surface)]">
          {items.map((item) => {
            const pending = pendingBackupId === item.id
            return (
              <tr key={item.id}>
                <td className="px-4 py-3 tabular-nums">{item.createdAtDisplay}</td>
                <td className="px-4 py-3 tabular-nums">v{item.schemaVersion}</td>
                <td className="px-4 py-3 tabular-nums">{item.sizeDisplay}</td>
                <td className="px-4 py-3">
                  <VerifiedBadge isVerified={item.isVerified} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={pending}
                      onClick={() => onVerify(item.id)}
                    >
                      Verify
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={pending}
                      onClick={() => onRestore(item.id)}
                    >
                      Restore
                    </Button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
