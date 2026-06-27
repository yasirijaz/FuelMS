import { type SelectHTMLAttributes, forwardRef } from 'react'
import { cn } from '../lib/cn'

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, invalid, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        'h-9 w-full rounded-[var(--ui-radius)] border bg-[var(--ui-surface)] px-3 text-sm text-[var(--ui-text)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-ring)]',
        invalid ? 'border-[var(--ui-danger)]' : 'border-[var(--ui-border)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    >
      {children}
    </select>
  )
})
