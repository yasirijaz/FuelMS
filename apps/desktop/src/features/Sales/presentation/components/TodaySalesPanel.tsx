import { formatFuelQuantity, formatMoneyDisplay } from '@fuelms/shared'
import { Card, CardBody, CardHeader, LoadingState } from '@fuelms/ui'
import { formatDate } from '@shared/utils/format'
import type { TodaySalesBucket, TodaySalesSummary } from '../../application/types/TodaySalesSummary'
import { hasTodaySalesActivity } from '../../application/services/todaySalesSummary'

type TodaySalesPanelProps = {
  summary: TodaySalesSummary | undefined
  isLoading?: boolean
  isError?: boolean
  error?: Error | null
  className?: string
}

function BucketRow({
  label,
  tone,
  bucket,
  hint,
}: {
  label: string
  tone: 'posted' | 'draft'
  bucket: TodaySalesBucket
  hint?: string
}) {
  const toneClasses =
    tone === 'posted'
      ? 'border-emerald-200 bg-emerald-50/60'
      : 'border-amber-200 bg-amber-50/60'

  return (
    <div className={`rounded-[var(--ui-radius)] border px-4 py-3 ${toneClasses}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-[var(--ui-text)]">{label}</p>
        <p className="text-lg font-semibold tabular-nums text-[var(--ui-text)]">
          {formatMoneyDisplay(bucket.revenueMinor)}
        </p>
      </div>
      <p className="mt-1 text-sm tabular-nums text-[var(--ui-text-muted)]">
        {bucket.saleCount.toLocaleString()} sale{bucket.saleCount === 1 ? '' : 's'} ·{' '}
        {formatFuelQuantity(bucket.quantityLitres)}
      </p>
      {hint && <p className="mt-2 text-xs text-[var(--ui-text-subtle)]">{hint}</p>}
    </div>
  )
}

export function TodaySalesPanel({
  summary,
  isLoading,
  isError,
  error,
  className,
}: TodaySalesPanelProps) {
  if (isLoading) {
    return <LoadingState className={className} title="Loading today's sales…" />
  }

  if (isError) {
    return (
      <Card className={className}>
        <CardBody>
          <p className="text-sm text-[var(--ui-danger)]">
            {error?.message ?? "Could not load today's sales."}
          </p>
        </CardBody>
      </Card>
    )
  }

  if (!summary) {
    return null
  }

  const dateLabel = formatDate(`${summary.dateIso}T12:00:00.000Z`)
  const isEmpty = !hasTodaySalesActivity(summary)

  return (
    <Card className={className}>
      <CardHeader>
        <h2 className="text-lg font-semibold text-[var(--ui-text)]">Today&apos;s sales</h2>
        <p className="mt-0.5 text-sm text-[var(--ui-text-muted)]">{dateLabel}</p>
      </CardHeader>
      <CardBody className="space-y-3">
        {isEmpty ? (
          <p className="text-sm text-[var(--ui-text-muted)]">
            No sales recorded for today yet. Use <strong>New Sale</strong> to record fuel sold.
          </p>
        ) : (
          <>
            <BucketRow
              label="Posted"
              tone="posted"
              bucket={summary.posted}
              hint="Counted in dashboard totals and reports."
            />
            {summary.draft.saleCount > 0 && (
              <BucketRow
                label="Draft"
                tone="draft"
                bucket={summary.draft}
                hint="Not posted yet — open the list below and click Post to finalize."
              />
            )}
          </>
        )}
      </CardBody>
    </Card>
  )
}
