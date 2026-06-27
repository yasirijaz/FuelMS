import { FilterBar, FilterGroup, SearchBar } from '@fuelms/ui'
import {
  PARTNER_ROLE_CODES,
  PARTNER_ROLE_LABELS,
} from '@features/BusinessPartners/domain/valueObjects/PartnerRoleCode'
import type { PersonLedgerBalanceFilters } from '../../application/types/PersonLedgerViewTypes'

const roleFilterOptions = PARTNER_ROLE_CODES.map((role) => ({
  value: role,
  label: PARTNER_ROLE_LABELS[role],
}))

type PersonLedgerBalanceToolbarProps = {
  filters: PersonLedgerBalanceFilters
  onFiltersChange: (filters: PersonLedgerBalanceFilters) => void
}

export function PersonLedgerBalanceToolbar({
  filters,
  onFiltersChange,
}: PersonLedgerBalanceToolbarProps) {
  return (
    <div className="space-y-4">
      <SearchBar
        value={filters.search}
        onChange={(event) => onFiltersChange({ ...filters, search: event.target.value })}
        onClear={() => onFiltersChange({ ...filters, search: '' })}
        placeholder="Search by partner name…"
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <FilterGroup>
          <FilterBar
            id="person-ledger-role-filter"
            label="Role"
            value={filters.roleCode}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                roleCode: event.target.value as PersonLedgerBalanceFilters['roleCode'],
              })
            }
            options={roleFilterOptions}
            placeholder="All roles"
          />
        </FilterGroup>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--ui-text-muted)]">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-[var(--ui-border)]"
            checked={filters.nonZeroOnly}
            onChange={(event) =>
              onFiltersChange({ ...filters, nonZeroOnly: event.target.checked })
            }
          />
          Non-zero only
        </label>
      </div>
    </div>
  )
}
