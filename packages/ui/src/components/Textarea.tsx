import { type TextareaHTMLAttributes, forwardRef } from 'react'
import { cn } from '../lib/cn'

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'min-h-24 w-full rounded-[var(--ui-radius)] border bg-[var(--ui-surface)] px-3 py-2 text-sm text-[var(--ui-text)]',
        'placeholder:text-[var(--ui-text-subtle)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-ring)]',
        invalid ? 'border-[var(--ui-danger)]' : 'border-[var(--ui-border)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  )
})
