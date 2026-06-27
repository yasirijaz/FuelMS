import { useEffect, useState } from 'react'
import { formatFuelQuantity, parseFuelQuantityInput } from '@fuelms/shared'
import { cn } from '../lib/cn'
import { Label } from '../components/Label'

export type FuelQuantityInputProps = {
  id?: string
  label?: string
  valueLitres?: number | null
  onChangeLitres?: (litres: number | null) => void
  required?: boolean
  disabled?: boolean
  error?: string
  hint?: string
  className?: string
}

export function FuelQuantityInput({
  id,
  label = 'Quantity',
  valueLitres,
  onChangeLitres,
  required,
  disabled,
  error,
  hint = 'Litres — up to 3 decimal places.',
  className,
}: FuelQuantityInputProps) {
  const inputId = id ?? 'fuel-quantity-input'
  const [text, setText] = useState(() =>
    valueLitres == null ? '' : valueLitres.toFixed(3).replace(/\.?0+$/, ''),
  )

  useEffect(() => {
    setText(valueLitres == null ? '' : formatFuelQuantity(valueLitres).replace(' L', ''))
  }, [valueLitres])

  const commit = (raw: string) => {
    const parsed = parseFuelQuantityInput(raw)
    onChangeLitres?.(parsed)
    if (parsed != null) {
      setText(parsed.toFixed(3).replace(/\.?0+$/, ''))
    }
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={inputId} required={required}>
        {label}
      </Label>
      <div className="relative">
        <input
          id={inputId}
          inputMode="decimal"
          disabled={disabled}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onBlur={(event) => commit(event.target.value)}
          placeholder="0.000"
          aria-invalid={Boolean(error)}
          className={cn(
            'h-9 w-full rounded-[var(--ui-radius)] border bg-[var(--ui-surface)] px-3 pr-10 text-sm tabular-nums',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-ring)]',
            error ? 'border-[var(--ui-danger)]' : 'border-[var(--ui-border)]',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        />
        <span
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--ui-text-subtle)]"
          aria-hidden
        >
          L
        </span>
      </div>
      {hint && !error && <p className="text-xs text-[var(--ui-text-subtle)]">{hint}</p>}
      {error && (
        <p className="text-xs text-[var(--ui-danger)]" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
