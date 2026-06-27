import { formatDate } from '@shared/utils/format'
import { Button } from '@fuelms/ui'
import type { SaleListItem } from '../../application/types/SaleListItem'
import { SaleStatusBadge } from './SaleStatusBadge'

type SaleListTableProps = {
  items: SaleListItem[]
  isLoading: boolean
  dateRangeLabel?: string
  onPost?: (saleId: string, version: number) => void
  onVoid?: (saleId: string, version: number) => void
  actionsPending?: boolean
}

export function SaleListTable({
  items,
  isLoading,
  dateRangeLabel,
  onPost,
  onVoid,
  actionsPending,
}: SaleListTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-6 py-12 text-center text-sm text-[var(--ui-text-muted)]">
        Loading sales…
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[var(--ui-radius)] border border-dashed border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-6 py-12 text-center">
        <p className="text-sm font-medium text-[var(--ui-text)]">No sales yet</p>
        <p className="mt-1 text-sm text-[var(--ui-text-muted)]">
          {dateRangeLabel
            ? `No sales between ${dateRangeLabel}. Try widening the date range above.`
            : 'Record your first fuel sale with the button above.'}
        </p>
      </div>
    )
  }

  const showActions = Boolean(onPost || onVoid)

  return (
    <div className="overflow-x-auto rounded-[var(--ui-radius)] border border-[var(--ui-border)]">
      <table className="min-w-full divide-y divide-[var(--ui-border)] text-sm">
        <thead className="bg-[var(--ui-surface-muted)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--ui-text-muted)]">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Product</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3 text-right">Litres</th>
            <th className="px-4 py-3 text-right">Amount</th>
            <th className="px-4 py-3">Notes</th>
            <th className="px-4 py-3">Status</th>
            {showActions && <th className="px-4 py-3 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--ui-border)] bg-[var(--ui-surface)]">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-[var(--ui-surface-muted)]">
              <td className="px-4 py-3 tabular-nums text-[var(--ui-text)]">
                {formatDate(item.saleDateIso)}
              </td>
              <td className="px-4 py-3 font-medium text-[var(--ui-text)]">{item.productLabel}</td>
              <td className="px-4 py-3 text-[var(--ui-text)]">{item.customerName}</td>
              <td className="px-4 py-3 text-right tabular-nums">{item.quantityDisplay}</td>
              <td className="px-4 py-3 text-right tabular-nums font-medium">
                {item.totalRevenueDisplay}
              </td>
              <td className="max-w-[12rem] truncate px-4 py-3 text-[var(--ui-text-muted)]">
                {item.notes?.trim() || '—'}
              </td>
              <td className="px-4 py-3">
                <SaleStatusBadge status={item.status} />
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
