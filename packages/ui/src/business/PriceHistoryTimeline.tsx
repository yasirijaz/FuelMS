import {
  formatMoneyDisplay,
  fuelProductDisplayName,
  type PriceHistoryEntry,
} from '@fuelms/shared'
import { cn } from '../lib/cn'
import { EmptyState } from '../components/States'

const STATUS_LABELS: Record<PriceHistoryEntry['status'], string> = {
  active: 'Active',
  scheduled: 'Scheduled',
  superseded: 'Superseded',
  cancelled: 'Cancelled',
}

const STATUS_STYLES: Record<PriceHistoryEntry['status'], string> = {
  active: 'bg-emerald-100 text-emerald-800',
  scheduled: 'bg-blue-100 text-blue-800',
  superseded: 'bg-slate-100 text-slate-600',
  cancelled: 'bg-red-100 text-red-800',
}

export type PriceHistoryTimelineProps = {
  entries: PriceHistoryEntry[]
  className?: string
}

export function PriceHistoryTimeline({ entries, className }: PriceHistoryTimelineProps) {
  if (entries.length === 0) {
    return (
      <EmptyState
        title="No price history"
        description="Price changes will appear here once recorded."
      />
    )
  }

  const sorted = [...entries].sort(
    (a, b) => new Date(b.effectiveFromIso).getTime() - new Date(a.effectiveFromIso).getTime(),
  )

  return (
    <ol className={cn('relative space-y-0', className)}>
      {sorted.map((entry, index) => {
        const isLast = index === sorted.length - 1
        return (
          <li key={entry.id} className="relative flex gap-4 pb-6">
            {!isLast && (
              <span
                className="absolute left-[7px] top-3 h-[calc(100%-4px)] w-px bg-[var(--ui-border)]"
                aria-hidden
              />
            )}
            <span
              className="relative z-10 mt-1.5 size-3.5 shrink-0 rounded-full border-2 border-[var(--ui-accent)] bg-[var(--ui-surface)]"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold tabular-nums text-[var(--ui-text)]">
                  {formatMoneyDisplay(entry.priceMinorPerLitre)} / L
                </p>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                    STATUS_STYLES[entry.status],
                  )}
                >
                  {STATUS_LABELS[entry.status]}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-[var(--ui-text-muted)]">
                {fuelProductDisplayName(entry.productCode)} ·{' '}
                {new Intl.DateTimeFormat('en-PK', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(entry.effectiveFromIso))}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
