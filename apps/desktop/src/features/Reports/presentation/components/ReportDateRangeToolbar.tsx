import { Input } from '@fuelms/ui'
import type { ReportDateRange } from '../../application/types/ReportViewTypes'

type ReportDateRangeToolbarProps = {
  range: ReportDateRange
  onRangeChange: (range: ReportDateRange) => void
}

export function ReportDateRangeToolbar({ range, onRangeChange }: ReportDateRangeToolbarProps) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-[var(--ui-text-muted)]">From</span>
        <Input
          type="date"
          value={range.fromDateIso}
          onChange={(event) =>
            onRangeChange({ ...range, fromDateIso: event.target.value })
          }
          className="w-auto min-w-[10rem]"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-[var(--ui-text-muted)]">To</span>
        <Input
          type="date"
          value={range.toDateIso}
          onChange={(event) => onRangeChange({ ...range, toDateIso: event.target.value })}
          className="w-auto min-w-[10rem]"
        />
      </label>
    </div>
  )
}
