import { Button, Input } from '@fuelms/ui'
import { getMonthDateRange } from '@shared/utils/dateInput'
import type { SaleListFilters } from '../../application/types/SaleListItem'
import {
  SALE_STATUS_LABELS,
  SALE_STATUSES,
} from '../../application/types/SaleListItem'

type SaleListToolbarProps = {
  filters: SaleListFilters
  onFiltersChange: (next: SaleListFilters) => void
}

export function SaleListToolbar({ filters, onFiltersChange }: SaleListToolbarProps) {
  const monthRange = getMonthDateRange()

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-[var(--ui-text-muted)]">From</span>
          <Input
            type="date"
            value={filters.fromDateIso}
            onChange={(event) =>
              onFiltersChange({ ...filters, fromDateIso: event.target.value })
            }
            className="w-auto min-w-[10rem]"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-[var(--ui-text-muted)]">To</span>
          <Input
            type="date"
            value={filters.toDateIso}
            onChange={(event) =>
              onFiltersChange({ ...filters, toDateIso: event.target.value })
            }
            className="w-auto min-w-[10rem]"
          />
        </label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            onFiltersChange({
              ...filters,
              fromDateIso: monthRange.fromDateIso,
              toDateIso: monthRange.toDateIso,
            })
          }
        >
          This month
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Search sales</span>
          <Input
            type="search"
            placeholder="Search customer or reference"
            value={filters.search}
            onChange={(event) =>
              onFiltersChange({ ...filters, search: event.target.value })
            }
          />
        </label>

        <label className="sm:w-44">
          <span className="sr-only">Filter by status</span>
          <select
            value={filters.status}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                status: event.target.value as SaleListFilters['status'],
              })
            }
            className="w-full rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm text-[var(--ui-text)]"
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            {SALE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {SALE_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}
