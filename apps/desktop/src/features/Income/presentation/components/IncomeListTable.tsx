import { formatDate } from '@shared/utils/format'
import { Button } from '@fuelms/ui'
import type { IncomeListItem } from '../../application/types/IncomeListItem'

type IncomeListTableProps = {
  items: IncomeListItem[]
  isLoading: boolean
  onVoid?: (incomeId: string, version: number) => void
  actionsPending?: boolean
}

export function IncomeListTable({
  items,
  isLoading,
  onVoid,
  actionsPending,
}: IncomeListTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-6 py-12 text-center text-sm text-[var(--ui-text-muted)]">
        Loading income…
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[var(--ui-radius)] border border-dashed border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-6 py-12 text-center">
        <p className="text-sm font-medium text-[var(--ui-text)]">No income yet</p>
        <p className="mt-1 text-sm text-[var(--ui-text-muted)]">
          Record your first operating income with the button above.
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
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Source</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Payment</th>
            {onVoid && <th className="px-4 py-3 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--ui-border)] bg-[var(--ui-surface)]">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-[var(--ui-surface-muted)]">
              <td className="px-4 py-3 tabular-nums">{formatDate(item.incomeDateIso)}</td>
              <td className="px-4 py-3">{item.categoryLabel}</td>
              <td className="px-4 py-3 font-medium">{item.sourceName}</td>
              <td className="px-4 py-3 tabular-nums">{item.amountDisplay}</td>
              <td className="px-4 py-3 text-[var(--ui-text-muted)]">
                {item.paymentStatusLabel}
                {item.cashAccountName ? ` · ${item.cashAccountName}` : ''}
              </td>
              {onVoid && (
                <td className="px-4 py-3 text-right">
                  {item.status === 'posted' ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={actionsPending}
                      onClick={() => onVoid(item.id, item.version)}
                    >
                      Void
                    </Button>
                  ) : (
                    <span className="text-xs text-[var(--ui-text-subtle)]">Voided</span>
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
