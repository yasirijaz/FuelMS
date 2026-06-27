import { formatDate } from '@shared/utils/format'
import type { PersonLedgerBalanceListItem } from '../../application/types/PersonLedgerViewTypes'

type PersonLedgerBalanceTableProps = {
  items: PersonLedgerBalanceListItem[]
  selectedPartnerId: string | null
  isLoading: boolean
  onSelectPartner: (partnerId: string) => void
}

export function PersonLedgerBalanceTable({
  items,
  selectedPartnerId,
  isLoading,
  onSelectPartner,
}: PersonLedgerBalanceTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-6 py-12 text-center text-sm text-[var(--ui-text-muted)]">
        Loading balances…
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[var(--ui-radius)] border border-dashed border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-6 py-12 text-center">
        <p className="text-sm font-medium text-[var(--ui-text)]">No partners found</p>
        <p className="mt-1 text-sm text-[var(--ui-text-muted)]">
          Adjust filters or record a borrow, lend, or repayment to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[var(--ui-radius)] border border-[var(--ui-border)]">
      <table className="min-w-full divide-y divide-[var(--ui-border)] text-sm">
        <thead className="bg-[var(--ui-surface-muted)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--ui-text-muted)]">
          <tr>
            <th className="px-4 py-3">Partner</th>
            <th className="px-4 py-3">Roles</th>
            <th className="px-4 py-3">Balance</th>
            <th className="px-4 py-3">Entries</th>
            <th className="px-4 py-3">Last activity</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--ui-border)] bg-[var(--ui-surface)]">
          {items.map((item) => {
            const isSelected = item.partnerId === selectedPartnerId
            return (
              <tr
                key={item.partnerId}
                className={`cursor-pointer hover:bg-[var(--ui-surface-muted)] ${
                  isSelected ? 'bg-[var(--ui-surface-muted)] ring-1 ring-inset ring-[var(--ui-border)]' : ''
                }`}
                onClick={() => onSelectPartner(item.partnerId)}
              >
                <td className="px-4 py-3 font-medium">{item.partnerName}</td>
                <td className="px-4 py-3 text-[var(--ui-text-muted)]">{item.rolesLabel}</td>
                <td className="px-4 py-3">
                  <div className="tabular-nums">{item.balanceDisplay}</div>
                  {item.orientation !== 'settled' && (
                    <div className="text-xs text-[var(--ui-text-subtle)]">{item.orientationLabel}</div>
                  )}
                </td>
                <td className="px-4 py-3 tabular-nums">{item.entryCount}</td>
                <td className="px-4 py-3 tabular-nums text-[var(--ui-text-muted)]">
                  {item.lastEntryDateIso ? formatDate(item.lastEntryDateIso) : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
