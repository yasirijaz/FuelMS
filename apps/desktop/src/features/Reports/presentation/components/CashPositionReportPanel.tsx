import { CashBalanceCard, DataTable, EmptyState, type DataTableColumn } from '@fuelms/ui'
import type {
  CashPositionLineView,
  CashPositionReportView,
} from '../../application/types/ReportViewTypes'

type CashPositionReportPanelProps = {
  report: CashPositionReportView | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
}

const columns: DataTableColumn<CashPositionLineView>[] = [
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
    id: 'balance',
    header: 'Balance',
    align: 'right',
    cell: (row) => row.balanceDisplay,
  },
]

export function CashPositionReportPanel({
  report,
  isLoading,
  isError,
  error,
}: CashPositionReportPanelProps) {
  if (isError) {
    return (
      <div className="rounded-[var(--ui-radius)] border border-[var(--ui-danger)]/30 bg-[var(--ui-danger)]/10 px-4 py-3 text-sm text-[var(--ui-danger)]">
        {error?.message ?? 'Failed to load cash position.'}
      </div>
    )
  }

  if (!isLoading && (!report || report.isEmpty)) {
    return (
      <EmptyState
        title="No active cash accounts"
        description="Active drawer, bank, and safe accounts with balances will appear here."
      />
    )
  }

  return (
    <div className="space-y-4">
      {report && (
        <p className="text-sm text-[var(--ui-text-muted)]">As of {report.asOfLabel}</p>
      )}
      <DataTable
        columns={columns}
        data={report?.lines ?? []}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            title="No active cash accounts"
            description="Active drawer, bank, and safe accounts with balances will appear here."
          />
        }
      />
      {report && !report.isEmpty && (
        <CashBalanceCard label="Total cash on hand" amountMinor={report.totalBalanceMinor} />
      )}
    </div>
  )
}
