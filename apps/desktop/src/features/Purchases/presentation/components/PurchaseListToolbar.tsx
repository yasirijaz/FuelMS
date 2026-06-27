import type { PurchaseListFilters } from '../../application/types/PurchaseListItem'
import {
  PURCHASE_STATUS_LABELS,
  PURCHASE_STATUSES,
} from '../../application/types/PurchaseListItem'

type PurchaseListToolbarProps = {
  filters: PurchaseListFilters
  onFiltersChange: (next: PurchaseListFilters) => void
}

export function PurchaseListToolbar({ filters, onFiltersChange }: PurchaseListToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <label className="min-w-0 flex-1">
        <span className="sr-only">Search purchases</span>
        <input
          type="search"
          placeholder="Search"
          value={filters.search}
          onChange={(event) =>
            onFiltersChange({ ...filters, search: event.target.value })
          }
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        />
      </label>

      <label className="sm:w-44">
        <span className="sr-only">Filter by status</span>
        <select
          value={filters.status}
          onChange={(event) =>
            onFiltersChange({
              ...filters,
              status: event.target.value as PurchaseListFilters['status'],
            })
          }
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          aria-label="Filter"
        >
          <option value="all">All statuses</option>
          {PURCHASE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {PURCHASE_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
