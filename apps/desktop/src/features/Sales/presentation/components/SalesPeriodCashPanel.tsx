import { formatFuelQuantity, formatMoneyDisplay } from '@fuelms/shared'
import { cn } from '@fuelms/ui'
import { formatDate } from '@shared/utils/format'
import type { SalesPeriodPaymentBucket, SalesPeriodSummary } from '../../application/services/salesPeriodSummary'

type SalesPeriodCashPanelProps = {
  summary: SalesPeriodSummary | undefined
  isLoading?: boolean
  className?: string
}

function Metric({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={cn('rounded-[var(--ui-radius)] border border-[var(--ui-border)] px-4 py-3', className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--ui-text-subtle)]">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--ui-text)]">{value}</p>
    </div>
  )
}

function BreakdownRow({ label, amountMinor }: { label: string; amountMinor: number }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-[var(--ui-text-muted)]">{label}</span>
      <span className="tabular-nums font-medium text-[var(--ui-text)]">
        {formatMoneyDisplay(amountMinor)}
      </span>
    </div>
  )
}

function BucketDetails({
  title,
  bucket,
  tone,
}: {
  title: string
  bucket: SalesPeriodPaymentBucket
  tone: 'posted' | 'draft'
}) {
  if (bucket.saleCount === 0) return null

  const toneClasses =
    tone === 'posted'
      ? 'border-emerald-200 bg-emerald-50/40'
      : 'border-amber-200 bg-amber-50/40'

  return (
    <div className={cn('rounded-[var(--ui-radius)] border px-4 py-3', toneClasses)}>
      <p className="text-sm font-semibold text-[var(--ui-text)]">{title}</p>
      <div className="mt-3 space-y-2">
        <BreakdownRow label="Cash" amountMinor={bucket.cashMinor} />
        <BreakdownRow label="Card" amountMinor={bucket.cardMinor} />
        <BreakdownRow label="Credit (not in hand)" amountMinor={bucket.creditMinor} />
      </div>
      <p className="mt-3 text-xs tabular-nums text-[var(--ui-text-muted)]">
        {bucket.saleCount.toLocaleString()} sale{bucket.saleCount === 1 ? '' : 's'} ·{' '}
        {formatFuelQuantity(bucket.quantityLitres)}
      </p>
    </div>
  )
}

export function SalesPeriodCashPanel({ summary, isLoading, className }: SalesPeriodCashPanelProps) {
  if (isLoading) {
    return (
      <div
        className={cn(
          'rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-4 py-8 text-center text-sm text-[var(--ui-text-muted)]',
          className,
        )}
      >
        Calculating net cash…
      </div>
    )
  }

  if (!summary) {
    return null
  }

  const periodLabel = `${formatDate(summary.fromDateIso)} – ${formatDate(summary.toDateIso)}`
  const hasDraftCash = summary.draft.netCashMinor > 0

  return (
    <div className={cn('space-y-4', className)}>
      <div className="rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-5 shadow-[var(--ui-shadow-sm)]">
        <p className="text-sm font-medium text-[var(--ui-text-muted)]">{periodLabel}</p>
        <p className="mt-1 text-xs text-[var(--ui-text-subtle)]">
          Net cash with me — posted cash and card sales in this period (credit excluded).
        </p>
        <p className="mt-4 text-3xl font-semibold tabular-nums tracking-tight text-[var(--ui-text)]">
          {formatMoneyDisplay(summary.posted.netCashMinor)}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Cash (posted)" value={formatMoneyDisplay(summary.posted.cashMinor)} />
        <Metric label="Card (posted)" value={formatMoneyDisplay(summary.posted.cardMinor)} />
        <Metric
          label="Credit (posted)"
          value={formatMoneyDisplay(summary.posted.creditMinor)}
          className="opacity-90"
        />
      </div>

      {(summary.posted.saleCount > 0 || hasDraftCash) && (
        <div className="grid gap-3 lg:grid-cols-2">
          <BucketDetails title="Posted breakdown" bucket={summary.posted} tone="posted" />
          {hasDraftCash && (
            <BucketDetails
              title={`Draft cash pending post (${formatMoneyDisplay(summary.draft.netCashMinor)})`}
              bucket={summary.draft}
              tone="draft"
            />
          )}
        </div>
      )}
    </div>
  )
}
