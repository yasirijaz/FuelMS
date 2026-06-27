import { useEffect, useState } from 'react'
import {
  formatMoneyMinor,
  parseMoneyInputToMinor,
  parseMoneyInputToMinorAllowZero,
  type MoneyMinor,
} from '@fuelms/shared'
import { cn } from '../lib/cn'
import { Label } from '../components/Label'

export type MoneyInputProps = {
  id?: string
  label?: string
  valueMinor?: MoneyMinor | null
  onChangeMinor?: (minor: MoneyMinor | null) => void
  allowZero?: boolean
  required?: boolean
  disabled?: boolean
  error?: string
  hint?: string
  className?: string
}

export function MoneyInput({
  id,
  label = 'Amount',
  valueMinor,
  onChangeMinor,
  allowZero = false,
  required,
  disabled,
  error,
  hint,
  className,
}: MoneyInputProps) {
  const inputId = id ?? 'money-input'
  const [text, setText] = useState(() =>
    valueMinor == null ? '' : formatMoneyMinor(valueMinor, 2),
  )

  useEffect(() => {
    setText(valueMinor == null ? '' : formatMoneyMinor(valueMinor, 2))
  }, [valueMinor])

  const parse = (raw: string) =>
    allowZero ? parseMoneyInputToMinorAllowZero(raw) : parseMoneyInputToMinor(raw)

  const commit = (raw: string) => {
    const parsed = parse(raw)
    onChangeMinor?.(parsed)
    if (parsed != null) {
      setText(formatMoneyMinor(parsed, 2))
    }
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={inputId} required={required}>
        {label}
      </Label>
      <div className="relative">
        <span
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--ui-text-subtle)]"
          aria-hidden
        >
          Rs.
        </span>
        <input
          id={inputId}
          inputMode="decimal"
          disabled={disabled}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onBlur={(event) => commit(event.target.value)}
          placeholder="0.00"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={cn(
            'h-9 w-full rounded-[var(--ui-radius)] border bg-[var(--ui-surface)] py-2 pl-10 pr-3 text-sm tabular-nums text-[var(--ui-text)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-ring)]',
            error ? 'border-[var(--ui-danger)]' : 'border-[var(--ui-border)]',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        />
      </div>
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs text-[var(--ui-text-subtle)]">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-[var(--ui-danger)]" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
