import { type LabelHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  required?: boolean
}

export function Label({ className, required, children, ...props }: LabelProps) {
  return (
    <label
      className={cn('text-sm font-medium text-[var(--ui-text)]', className)}
      {...props}
    >
      {children}
      {required && (
        <span className="ml-0.5 text-[var(--ui-danger)]" aria-hidden>
          *
        </span>
      )}
    </label>
  )
}
