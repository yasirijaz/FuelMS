import { Card, CardBody, DataTable, EmptyState, type DataTableColumn } from '@fuelms/ui'
import type {
  PersonBalanceLineView,
  PersonLedgerSummaryReportView,
} from '../../application/types/ReportViewTypes'

type PersonBalancesReportPanelProps = {
  report: PersonLedgerSummaryReportView | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
}

const columns: DataTableColumn<PersonBalanceLineView>[] = [
  {
    id: 'partner',
    header: 'Partner',
    cell: (row) => row.partnerName,
  },
  {
    id: 'kind',
    header: 'Balance type',
    cell: (row) => (row.balanceKind === 'receivable' ? 'Receivable' : 'Payable'),
  },
  {
    id: 'balance',
    header: 'Balance',
    align: 'right',
    cell: (row) => row.balanceDisplay,
  },
  {
    id: 'entries',
    header: 'Entries',
    align: 'right',
    cell: (row) => row.entryCount.toLocaleString(),
  },
]

export function PersonBalancesReportPanel({
  report,
  isLoading,
  isError,
  error,
}: PersonBalancesReportPanelProps) {
  if (isError) {
    return (
      <div className="rounded-[var(--ui-radius)] border border-[var(--ui-danger)]/30 bg-[var(--ui-danger)]/10 px-4 py-3 text-sm text-[var(--ui-danger)]">
        {error?.message ?? 'Failed to load person balances.'}
      </div>
    )
  }

  if (!isLoading && (!report || report.isEmpty)) {
    return (
      <EmptyState
        title="No partner balances"
        description="Partners with non-zero receivable or payable balances will appear here."
      />
    )
  }

  return (
    <div className="space-y-4">
      {report && (
        <p className="text-sm text-[var(--ui-text-muted)]">As of {report.asOfLabel}</p>
      )}
      {report && !report.isEmpty && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <CardBody>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--ui-text-muted)]">
                Total receivable
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--ui-text)]">
                {report.receivableTotalDisplay}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--ui-text-muted)]">
                Total payable
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--ui-text)]">
                {report.payableTotalDisplay}
              </p>
            </CardBody>
          </Card>
        </div>
      )}
      <DataTable
        columns={columns}
        data={report?.lines ?? []}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            title="No partner balances"
            description="Partners with non-zero receivable or payable balances will appear here."
          />
        }
      />
    </div>
  )
}
