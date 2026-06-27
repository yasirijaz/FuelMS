import { formatDate } from '@shared/utils/format'
import { Button } from '@fuelms/ui'
import type { PurchaseListItem } from '../../application/types/PurchaseListItem'
import { PurchaseStatusBadge } from './PurchaseStatusBadge'

type PurchaseListTableProps = {
  items: PurchaseListItem[]
  isLoading: boolean
  onPost?: (purchaseId: string, version: number) => void
  onVoid?: (purchaseId: string, version: number) => void
  actionsPending?: boolean
}

export function PurchaseListTable({
  items,
  isLoading,
  onPost,
  onVoid,
  actionsPending,
}: PurchaseListTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-6 py-12 text-center text-sm text-[var(--ui-text-muted)]">
        Loading purchases…
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[var(--ui-radius)] border border-dashed border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-6 py-12 text-center">
        <p className="text-sm font-medium text-[var(--ui-text)]">No purchases yet</p>
        <p className="mt-1 text-sm text-[var(--ui-text-muted)]">
          Record your first fuel purchase with the button above.
        </p>
      </div>
    )
  }

  const showActions = Boolean(onPost || onVoid)

  return (
    <div className="overflow-hidden rounded-[var(--ui-radius)] border border-[var(--ui-border)]">
      <table className="min-w-full divide-y divide-[var(--ui-border)] text-sm">
        <thead className="bg-[var(--ui-surface-muted)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--ui-text-muted)]">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Supplier</th>
            <th className="px-4 py-3">Status</th>
            {showActions && <th className="px-4 py-3 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--ui-border)] bg-[var(--ui-surface)]">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-[var(--ui-surface-muted)]">
              <td className="px-4 py-3 tabular-nums text-[var(--ui-text)]">
                {formatDate(item.purchaseDateIso)}
              </td>
              <td className="px-4 py-3 font-medium text-[var(--ui-text)]">{item.supplierName}</td>
              <td className="px-4 py-3">
                <PurchaseStatusBadge status={item.status} />
              </td>
              {showActions && (
                <td className="px-4 py-3 text-right">
                  {item.status === 'draft' ? (
                    <div className="flex justify-end gap-2">
                      {onPost && (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={actionsPending}
                          onClick={() => onPost(item.id, item.version)}
                        >
                          Post
                        </Button>
                      )}
                      {onVoid && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={actionsPending}
                          onClick={() => onVoid(item.id, item.version)}
                        >
                          Void
                        </Button>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-[var(--ui-text-subtle)]">—</span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
