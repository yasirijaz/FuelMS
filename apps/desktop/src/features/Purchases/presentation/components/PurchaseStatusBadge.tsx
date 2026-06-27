import type { PurchaseStatus } from '../../application/types/PurchaseListItem'
import { PURCHASE_STATUS_LABELS } from '../../application/types/PurchaseListItem'

const STATUS_STYLES: Record<PurchaseStatus, string> = {
  draft: 'bg-amber-100 text-amber-800',
  posted: 'bg-emerald-100 text-emerald-800',
  void: 'bg-slate-100 text-slate-600',
}

type PurchaseStatusBadgeProps = {
  status: PurchaseStatus
}

export function PurchaseStatusBadge({ status }: PurchaseStatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {PURCHASE_STATUS_LABELS[status]}
    </span>
  )
}
