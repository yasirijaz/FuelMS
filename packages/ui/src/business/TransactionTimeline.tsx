import { formatMoneyDisplay, type TransactionTimelineEntry } from '@fuelms/shared'
import { cn } from '../lib/cn'
import { EmptyState } from '../components/States'

const TONE_STYLES: Record<NonNullable<TransactionTimelineEntry['tone']>, string> = {
  neutral: 'text-[var(--ui-text)]',
  credit: 'text-emerald-700',
  debit: 'text-red-700',
}

export type TransactionTimelineProps = {
  entries: TransactionTimelineEntry[]
  className?: string
}

export function TransactionTimeline({ entries, className }: TransactionTimelineProps) {
  if (entries.length === 0) {
    return (
      <EmptyState
        title="No transactions"
        description="Activity will appear here as business events are recorded."
      />
    )
  }

  const sorted = [...entries].sort(
    (a, b) => new Date(b.occurredAtIso).getTime() - new Date(a.occurredAtIso).getTime(),
  )

  return (
    <ol className={cn('space-y-3', className)}>
      {sorted.map((entry) => (
        <li
          key={entry.id}
          className="flex items-start justify-between gap-4 rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 py-3"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--ui-text)]">{entry.title}</p>
            {entry.description && (
              <p className="mt-0.5 text-sm text-[var(--ui-text-muted)]">{entry.description}</p>
            )}
            <p className="mt-1 text-xs text-[var(--ui-text-subtle)]">
              {new Intl.DateTimeFormat('en-PK', {
                dateStyle: 'medium',
                timeStyle: 'short',
              }).format(new Date(entry.occurredAtIso))}
            </p>
          </div>
          {entry.amountMinor != null && (
            <p
              className={cn(
                'shrink-0 text-sm font-semibold tabular-nums',
                TONE_STYLES[entry.tone ?? 'neutral'],
              )}
            >
              {entry.tone === 'debit' ? '−' : entry.tone === 'credit' ? '+' : ''}
              {formatMoneyDisplay(Math.abs(entry.amountMinor))}
            </p>
          )}
        </li>
      ))}
    </ol>
  )
}
