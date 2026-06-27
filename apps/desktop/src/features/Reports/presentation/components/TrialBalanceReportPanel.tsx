import { cn, DataTable, EmptyState, type DataTableColumn } from '@fuelms/ui'
import type {
  TrialBalanceLineView,
  TrialBalanceReportView,
} from '../../application/types/ReportViewTypes'

type TrialBalanceReportPanelProps = {
  report: TrialBalanceReportView | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
}

const columns: DataTableColumn<TrialBalanceLineView>[] = [
  {
    id: 'code',
    header: 'Code',
    cell: (row) => row.accountCode,
  },
  {
    id: 'account',
    header: 'Account',
    cell: (row) => row.accountName,
  },
  {
    id: 'type',
    header: 'Type',
    cell: (row) => row.accountType,
  },
  {
    id: 'debit',
    header: 'Debit',
    align: 'right',
    cell: (row) => row.debitDisplay,
  },
  {
    id: 'credit',
    header: 'Credit',
    align: 'right',
    cell: (row) => row.creditDisplay,
  },
]

function BalancedBadge({ isBalanced }: { isBalanced: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        isBalanced
          ? 'bg-emerald-500/15 text-emerald-700'
          : 'bg-[var(--ui-danger)]/15 text-[var(--ui-danger)]',
      )}
    >
      {isBalanced ? 'Balanced' : 'Out of balance'}
    </span>
  )
}

export function TrialBalanceReportPanel({
  report,
  isLoading,
  isError,
  error,
}: TrialBalanceReportPanelProps) {
  if (isError) {
    return (
      <div className="rounded-[var(--ui-radius)] border border-[var(--ui-danger)]/30 bg-[var(--ui-danger)]/10 px-4 py-3 text-sm text-[var(--ui-danger)]">
        {error?.message ?? 'Failed to load trial balance.'}
      </div>
    )
  }

  if (!isLoading && (!report || report.isEmpty)) {
    return (
      <EmptyState
        title="No ledger activity"
        description="Accounts with non-zero posted journal balances will appear here."
      />
    )
  }

  return (
    <div className="space-y-4">
      {report && (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-[var(--ui-text-muted)]">As of {report.asOfLabel}</p>
          <BalancedBadge isBalanced={report.isBalanced} />
        </div>
      )}
      <DataTable
        columns={columns}
        data={report?.lines ?? []}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            title="No ledger activity"
            description="Accounts with non-zero posted journal balances will appear here."
          />
        }
      />
      {report && !report.isEmpty && (
        <div className="overflow-hidden rounded-[var(--ui-radius)] border border-[var(--ui-border)]">
          <table className="min-w-full divide-y divide-[var(--ui-border)] text-sm">
            <thead className="bg-[var(--ui-surface-muted)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--ui-text-muted)]">
              <tr>
                <th className="px-4 py-3">Totals</th>
                <th className="px-4 py-3 text-right">Debit</th>
                <th className="px-4 py-3 text-right">Credit</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ui-border)] bg-[var(--ui-surface-muted)]">
              <tr>
                <td className="px-4 py-3 font-semibold text-[var(--ui-text)]">Trial balance</td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold">
                  {report.totalDebitDisplay}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold">
                  {report.totalCreditDisplay}
                </td>
                <td className="px-4 py-3 text-right">
                  <BalancedBadge isBalanced={report.isBalanced} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
