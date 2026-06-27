import {
  FUEL_PRODUCT_COLORS,
  fuelProductDisplayName,
  formatFuelQuantity,
  type FuelProductCode,
} from '@fuelms/shared'
import { cn } from '../lib/cn'

export type TankLevelIndicatorProps = {
  productCode: FuelProductCode
  fillPercent: number
  capacityLitres?: number
  currentLitres?: number
  className?: string
}

export function TankLevelIndicator({
  productCode,
  fillPercent,
  capacityLitres,
  currentLitres,
  className,
}: TankLevelIndicatorProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(fillPercent)))
  const color = FUEL_PRODUCT_COLORS[productCode]
  const isLow = clamped < 20

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: color }}
            aria-hidden
          />
          <span className="text-sm font-medium text-[var(--ui-text)]">
            {fuelProductDisplayName(productCode)}
          </span>
        </div>
        <span
          className={cn(
            'text-sm font-semibold tabular-nums',
            isLow ? 'text-[var(--ui-danger)]' : 'text-[var(--ui-text-muted)]',
          )}
        >
          {clamped}%
        </span>
      </div>

      <div
        className="h-3 overflow-hidden rounded-full bg-[var(--ui-surface-muted)]"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${fuelProductDisplayName(productCode)} tank level`}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>

      {(capacityLitres != null || currentLitres != null) && (
        <p className="text-xs text-[var(--ui-text-subtle)]">
          {currentLitres != null && formatFuelQuantity(currentLitres)}
          {capacityLitres != null && currentLitres != null && ' / '}
          {capacityLitres != null && formatFuelQuantity(capacityLitres)}
        </p>
      )}

      {isLow && (
        <p className="text-xs font-medium text-[var(--ui-danger)]" role="status">
          Low tank level — schedule replenishment.
        </p>
      )}
    </div>
  )
}
