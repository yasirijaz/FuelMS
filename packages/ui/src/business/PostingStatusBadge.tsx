import { POSTING_STATUS_LABELS, type PostingStatus } from '@fuelms/shared'
import { cn } from '../lib/cn'

const STATUS_STYLES: Record<PostingStatus, string> = {
  draft: 'bg-amber-100 text-amber-900 border-amber-200',
  posted: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  reversed: 'bg-violet-100 text-violet-900 border-violet-200',
  void: 'bg-slate-100 text-slate-600 border-slate-200',
}

export type PostingStatusBadgeProps = {
  status: PostingStatus
  className?: string
}

export function PostingStatusBadge({ status, className }: PostingStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        STATUS_STYLES[status],
        className,
      )}
    >
      {POSTING_STATUS_LABELS[status]}
    </span>
  )
}
