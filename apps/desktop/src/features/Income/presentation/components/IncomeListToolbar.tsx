import { Input, Select } from '@fuelms/ui'
import type { IncomeListFilters } from '../../application/types/IncomeListItem'

type IncomeListToolbarProps = {
  filters: IncomeListFilters
  onFiltersChange: (filters: IncomeListFilters) => void
}

export function IncomeListToolbar({ filters, onFiltersChange }: IncomeListToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="flex-1 space-y-1.5 text-sm">
        <span className="text-[var(--ui-text-muted)]">Search</span>
        <Input
          value={filters.search}
          onChange={(event) => onFiltersChange({ ...filters, search: event.target.value })}
          placeholder="Source, reference, category…"
        />
      </label>
      <label className="space-y-1.5 text-sm">
        <span className="text-[var(--ui-text-muted)]">Status</span>
        <Select
          value={filters.status}
          onChange={(event) =>
            onFiltersChange({
              ...filters,
              status: event.target.value as IncomeListFilters['status'],
            })
          }
        >
          <option value="posted">Posted</option>
          <option value="void">Void</option>
          <option value="all">All</option>
        </Select>
      </label>
    </div>
  )
}
