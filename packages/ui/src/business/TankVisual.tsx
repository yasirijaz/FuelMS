import {
  FUEL_PRODUCT_COLORS,
  fuelProductDisplayName,
  formatFuelQuantity,
  type FuelProductCode,
} from '@fuelms/shared'
import { cn } from '../lib/cn'

export type TankVisualProps = {
  productCode: FuelProductCode
  fillPercent: number
  capacityLitres?: number
  currentLitres?: number
  className?: string
  /** Compact size for cards; default is overview row. */
  size?: 'sm' | 'md'
}

export function TankVisual({
  productCode,
  fillPercent,
  capacityLitres,
  currentLitres,
  className,
  size = 'md',
}: TankVisualProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(fillPercent)))
  const color = FUEL_PRODUCT_COLORS[productCode]
  const isLow = clamped < 20
  const isCompact = size === 'sm'
  const labelOnFill = clamped >= 35

  return (
    <div
      className={cn('flex flex-col items-center', isCompact ? 'gap-2' : 'gap-3', className)}
      role="group"
      aria-label={`${fuelProductDisplayName(productCode)} tank ${clamped}% full`}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn('rounded-full', isCompact ? 'size-2' : 'size-2.5')}
          style={{ backgroundColor: color }}
          aria-hidden
        />
        <span
          className={cn(
            'font-medium text-[var(--ui-text)]',
            isCompact ? 'text-xs' : 'text-sm',
          )}
        >
          {fuelProductDisplayName(productCode)}
        </span>
      </div>

      <div
        className={cn('relative', isCompact ? 'h-28 w-16' : 'h-44 w-24')}
        role="img"
        aria-hidden
      >
        <div
          className={cn(
            'absolute left-1/2 -translate-x-1/2 rounded-t-md bg-[var(--ui-border)]',
            isCompact ? '-top-1.5 h-2 w-6' : '-top-2 h-2.5 w-8',
          )}
        />

        <div
          className={cn(
            'absolute inset-x-0 bottom-0 overflow-hidden border-2 border-[var(--ui-border)] bg-[var(--ui-surface-muted)] shadow-[inset_0_2px_8px_rgba(0,0,0,0.06)]',
            isCompact ? 'top-1 rounded-[14px]' : 'top-1.5 rounded-[18px]',
          )}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${fuelProductDisplayName(productCode)} fill level`}
        >
          <div
            className="absolute inset-x-0 bottom-0 transition-all duration-500 ease-out"
            style={{
              height: `${clamped}%`,
              background: `linear-gradient(180deg, ${color}dd 0%, ${color} 55%, ${color}cc 100%)`,
            }}
          >
            {clamped > 8 && (
              <div
                className="absolute inset-x-0 top-0 h-1 opacity-40"
                style={{ backgroundColor: color, filter: 'brightness(1.35)' }}
              />
            )}
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={cn(
                'font-bold tabular-nums drop-shadow-sm',
                isCompact ? 'text-base' : 'text-2xl',
                labelOnFill ? 'text-white' : 'text-[var(--ui-text-muted)]',
              )}
            >
              {clamped}%
            </span>
          </div>
        </div>
      </div>

      {(capacityLitres != null || currentLitres != null) && (
        <p
          className={cn(
            'text-center tabular-nums text-[var(--ui-text-subtle)]',
            isCompact ? 'text-[10px]' : 'text-xs',
          )}
        >
          {currentLitres != null && formatFuelQuantity(currentLitres)}
          {capacityLitres != null && currentLitres != null && ' / '}
          {capacityLitres != null && formatFuelQuantity(capacityLitres)}
        </p>
      )}

      {isLow && !isCompact && (
        <p className="text-center text-xs font-medium text-[var(--ui-danger)]" role="status">
          Low level
        </p>
      )}
    </div>
  )
}
