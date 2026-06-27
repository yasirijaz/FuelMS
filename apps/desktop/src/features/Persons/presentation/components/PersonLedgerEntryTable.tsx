import { formatDate } from '@shared/utils/format'
import type { PersonLedgerEntryListItem } from '../../application/types/PersonLedgerViewTypes'

type PersonLedgerEntryTableProps = {
  items: PersonLedgerEntryListItem[]
  isLoading: boolean
}

export function PersonLedgerEntryTable({ items, isLoading }: PersonLedgerEntryTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-6 py-8 text-center text-sm text-[var(--ui-text-muted)]">
        Loading entries…
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[var(--ui-radius)] border border-dashed border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-6 py-8 text-center">
        <p className="text-sm font-medium text-[var(--ui-text)]">No entries yet</p>
        <p className="mt-1 text-sm text-[var(--ui-text-muted)]">
          Record a borrow, lend, or repayment using the action buttons above.
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
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Balance after</th>
            <th className="px-4 py-3">Cash account</th>
            <th className="px-4 py-3">Reference</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--ui-border)] bg-[var(--ui-surface)]">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-[var(--ui-surface-muted)]">
              <td className="px-4 py-3 tabular-nums">{formatDate(item.entryDateIso)}</td>
              <td className="px-4 py-3">{item.entryTypeLabel}</td>
              <td className="px-4 py-3 tabular-nums">
                {item.signedAmountMinor >= 0 ? '+' : '−'}
                {item.signedAmountDisplay}
              </td>
              <td className="px-4 py-3 tabular-nums">{item.balanceAfterDisplay}</td>
              <td className="px-4 py-3 text-[var(--ui-text-muted)]">{item.cashAccountName ?? '—'}</td>
              <td className="px-4 py-3 text-[var(--ui-text-muted)]">{item.reference ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
