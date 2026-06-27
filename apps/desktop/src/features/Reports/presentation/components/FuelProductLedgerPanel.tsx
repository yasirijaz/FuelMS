import { cn } from '@fuelms/ui'
import type { FuelProductLedgerReportView } from '../../application/types/ReportViewTypes'
import { FuelProductTAccountTable } from './FuelProductTAccountTable'

type FuelProductLedgerPanelProps = {
  report: FuelProductLedgerReportView | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
}

function ProfitBadge({
  label,
  value,
  amountMinor,
}: {
  label: string
  value: string
  amountMinor: number
}) {
  return (
    <div className="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--ui-text-subtle)]">
        {label}
      </p>
      <p
        className={cn(
          'mt-1 text-xl font-semibold tabular-nums tracking-tight',
          amountMinor > 0 && 'text-emerald-700',
          amountMinor < 0 && 'text-red-700',
          amountMinor === 0 && 'text-[var(--ui-text)]',
        )}
      >
        {value}
      </p>
    </div>
  )
}

export function FuelProductLedgerPanel({
  report,
  isLoading,
  isError,
  error,
}: FuelProductLedgerPanelProps) {
  if (isError) {
    return (
      <div className="rounded-[var(--ui-radius)] border border-[var(--ui-danger)]/30 bg-[var(--ui-danger)]/10 px-4 py-3 text-sm text-[var(--ui-danger)]">
        {error?.message ?? 'Failed to load fuel ledger.'}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-6 py-12 text-center text-sm text-[var(--ui-text-muted)]">
        Loading fuel ledger…
      </div>
    )
  }

  if (!report) {
    return null
  }

  const periodLabel = `${report.fromDateLabel} – ${report.toDateLabel}`

  return (
    <div className="space-y-6">
      <div className="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-4 py-3 text-sm text-[var(--ui-text-muted)]">
        Purchases and sales in T-account form — debit (purchase) on the left, credit (sales) on the
        right. Draft entries are shown here but only posted entries count toward net totals and
        profit. Post drafts from the Sales or Purchases pages. Adjust the date range above if
        entries fall outside the current period.
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ProfitBadge
          label="Overall profit (all time, posted)"
          value={report.allTimeProfitDisplay}
          amountMinor={report.allTimeProfitMinor}
        />
        <ProfitBadge
          label={`Period profit (${periodLabel})`}
          value={report.periodProfitDisplay}
          amountMinor={report.periodProfitMinor}
        />
      </div>

      <div className="space-y-8">
        {report.products.map((product) => (
          <FuelProductTAccountTable
            key={product.productCode}
            product={product}
            periodLabel={periodLabel}
          />
        ))}
      </div>
    </div>
  )
}
