import { Card, CardBody, EmptyState } from '@fuelms/ui'
import type { ProfitLossReportView } from '../../application/types/ReportViewTypes'

type ProfitLossReportPanelProps = {
  report: ProfitLossReportView | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
}

type SummaryRow = {
  label: string
  value: string
  emphasis?: boolean
}

function SummaryRows({ rows }: { rows: SummaryRow[] }) {
  return (
    <div className="divide-y divide-[var(--ui-border)] rounded-[var(--ui-radius)] border border-[var(--ui-border)]">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
        >
          <span className={row.emphasis ? 'font-semibold text-[var(--ui-text)]' : 'text-[var(--ui-text-muted)]'}>
            {row.label}
          </span>
          <span
            className={
              row.emphasis
                ? 'text-base font-semibold tabular-nums text-[var(--ui-text)]'
                : 'tabular-nums text-[var(--ui-text)]'
            }
          >
            {row.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export function ProfitLossReportPanel({
  report,
  isLoading,
  isError,
  error,
}: ProfitLossReportPanelProps) {
  if (isLoading) {
    return (
      <div className="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-6 py-12 text-center text-sm text-[var(--ui-text-muted)]">
        Loading profit &amp; loss…
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-[var(--ui-radius)] border border-[var(--ui-danger)]/30 bg-[var(--ui-danger)]/10 px-4 py-3 text-sm text-[var(--ui-danger)]">
        {error?.message ?? 'Failed to load profit & loss report.'}
      </div>
    )
  }

  if (!report || report.isEmpty) {
    return (
      <EmptyState
        title="No activity in this period"
        description="Posted fuel sales, income, and expenses in the selected date range will appear here."
      />
    )
  }

  const rows: SummaryRow[] = [
    { label: 'Fuel sales revenue', value: report.fuelSalesRevenueDisplay },
    { label: 'Cost of goods sold', value: report.fuelCogsDisplay },
    { label: 'Gross profit', value: report.grossProfitDisplay, emphasis: true },
    { label: 'Other income', value: report.otherIncomeDisplay },
    { label: 'Operating expenses', value: report.operatingExpensesDisplay },
    { label: 'Net operating profit', value: report.netOperatingProfitDisplay, emphasis: true },
  ]

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--ui-text-muted)]">
        {report.fromDateLabel} – {report.toDateLabel}
      </p>
      <SummaryRows rows={rows} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--ui-text-muted)]">
              Posted sales
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--ui-text)]">
              {report.postedSaleCount}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--ui-text-muted)]">
              Posted expenses
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--ui-text)]">
              {report.postedExpenseCount}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--ui-text-muted)]">
              Posted income
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--ui-text)]">
              {report.postedIncomeCount}
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
