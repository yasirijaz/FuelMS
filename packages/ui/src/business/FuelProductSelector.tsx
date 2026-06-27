import {
  FUEL_PRODUCT_CODES,
  fuelProductDisplayName,
  type FuelProductCode,
} from '@fuelms/shared'
import { cn } from '../lib/cn'
import { Label } from '../components/Label'
import { Select } from '../components/Select'

export type FuelProductSelectorProps = {
  id?: string
  label?: string
  value?: FuelProductCode | null
  onChange?: (code: FuelProductCode | null) => void
  mode?: 'select' | 'segmented'
  disabled?: boolean
  error?: string
  className?: string
}

export function FuelProductSelector({
  id,
  label = 'Fuel product',
  value,
  onChange,
  mode = 'select',
  disabled,
  error,
  className,
}: FuelProductSelectorProps) {
  const fieldId = id ?? 'fuel-product-selector'

  if (mode === 'segmented') {
    return (
      <div className={cn('space-y-1.5', className)}>
        <Label>{label}</Label>
        <div
          role="radiogroup"
          aria-label={label}
          className="inline-flex rounded-[var(--ui-radius)] border border-[var(--ui-border)] p-1"
        >
          {FUEL_PRODUCT_CODES.map((code) => {
            const selected = value === code
            return (
              <button
                key={code}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={disabled}
                onClick={() => onChange?.(code)}
                className={cn(
                  'rounded-[calc(var(--ui-radius)-2px)] px-3 py-1.5 text-sm font-medium transition-colors',
                  selected
                    ? 'bg-[var(--ui-accent)] text-[var(--ui-accent-fg)]'
                    : 'text-[var(--ui-text-muted)] hover:bg-[var(--ui-surface-hover)]',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                )}
              >
                {fuelProductDisplayName(code)}
              </button>
            )
          })}
        </div>
        {error && (
          <p className="text-xs text-[var(--ui-danger)]" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={fieldId}>{label}</Label>
      <Select
        id={fieldId}
        disabled={disabled}
        invalid={Boolean(error)}
        value={value ?? ''}
        onChange={(event) => onChange?.((event.target.value as FuelProductCode) || null)}
      >
        <option value="">Select product…</option>
        {FUEL_PRODUCT_CODES.map((code) => (
          <option key={code} value={code}>
            {fuelProductDisplayName(code)}
          </option>
        ))}
      </Select>
      {error && (
        <p className="text-xs text-[var(--ui-danger)]" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
