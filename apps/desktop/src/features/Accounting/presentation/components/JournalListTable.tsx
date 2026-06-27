import { formatDate } from '@shared/utils/format'
import { PostingStatusBadge } from '@fuelms/ui'
import type { JournalListItem } from '../../application/types/AccountingViewTypes'

type JournalListTableProps = {
  items: JournalListItem[]
  isLoading: boolean
  onSelect: (journalId: string) => void
}

export function JournalListTable({ items, isLoading, onSelect }: JournalListTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-6 py-12 text-center text-sm text-[var(--ui-text-muted)]">
        Loading journal entries…
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[var(--ui-radius)] border border-dashed border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-6 py-12 text-center">
        <p className="text-sm font-medium text-[var(--ui-text)]">No journal entries yet</p>
        <p className="mt-1 text-sm text-[var(--ui-text-muted)]">
          Posted journals from business modules will appear here.
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
            <th className="px-4 py-3">Memo / source</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Debit</th>
            <th className="px-4 py-3 text-right">Credit</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--ui-border)] bg-[var(--ui-surface)]">
          {items.map((item) => (
            <tr
              key={item.id}
              className="cursor-pointer hover:bg-[var(--ui-surface-muted)]"
              onClick={() => onSelect(item.id)}
            >
              <td className="px-4 py-3 tabular-nums">{formatDate(item.entryDateIso)}</td>
              <td className="px-4 py-3">{item.memoOrSource}</td>
              <td className="px-4 py-3">
                <PostingStatusBadge status={item.postingStatus} />
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{item.totalDebitDisplay}</td>
              <td className="px-4 py-3 text-right tabular-nums">{item.totalCreditDisplay}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
