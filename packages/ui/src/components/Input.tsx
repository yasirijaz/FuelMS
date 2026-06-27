import { type InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '../lib/cn'

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-9 w-full rounded-[var(--ui-radius)] border bg-[var(--ui-surface)] px-3 text-sm text-[var(--ui-text)]',
        'placeholder:text-[var(--ui-text-subtle)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-ring)]',
        invalid
          ? 'border-[var(--ui-danger)]'
          : 'border-[var(--ui-border)] hover:border-[var(--ui-border-strong)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  )
})
