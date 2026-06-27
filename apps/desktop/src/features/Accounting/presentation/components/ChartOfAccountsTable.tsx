import { groupAccountsByType, type LedgerAccountListItem } from '../../application/types/AccountingViewTypes'

type ChartOfAccountsTableProps = {
  accounts: LedgerAccountListItem[]
  isLoading: boolean
}

export function ChartOfAccountsTable({ accounts, isLoading }: ChartOfAccountsTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-6 py-12 text-center text-sm text-[var(--ui-text-muted)]">
        Loading chart of accounts…
      </div>
    )
  }

  const groups = groupAccountsByType(accounts)

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.accountType}>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--ui-text-muted)]">
            {group.label}
          </h3>
          <div className="overflow-hidden rounded-[var(--ui-radius)] border border-[var(--ui-border)]">
            <table className="min-w-full divide-y divide-[var(--ui-border)] text-sm">
              <thead className="bg-[var(--ui-surface-muted)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--ui-text-muted)]">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ui-border)] bg-[var(--ui-surface)]">
                {group.accounts.map((account) => (
                  <tr key={account.id} className="hover:bg-[var(--ui-surface-muted)]">
                    <td className="px-4 py-3 font-mono text-xs text-[var(--ui-text-muted)]">
                      {account.code}
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--ui-text)]">{account.name}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{account.balanceDisplay}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
