import type { SaleStatus } from '../../application/types/SaleListItem'
import { SALE_STATUS_LABELS } from '../../application/types/SaleListItem'

const STATUS_STYLES: Record<SaleStatus, string> = {
  draft: 'bg-amber-100 text-amber-800',
  posted: 'bg-emerald-100 text-emerald-800',
  void: 'bg-slate-100 text-slate-600',
}

type SaleStatusBadgeProps = {
  status: SaleStatus
}

export function SaleStatusBadge({ status }: SaleStatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {SALE_STATUS_LABELS[status]}
    </span>
  )
}
