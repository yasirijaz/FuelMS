import { type ReactNode } from 'react'
import { cn } from '../lib/cn'
import { Label } from './Label'

export type FormFieldProps = {
  id: string
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
}

export function FormField({
  id,
  label,
  hint,
  error,
  required,
  children,
  className,
}: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      {children}
      {hint && !error && (
        <p id={hintId} className="text-xs text-[var(--ui-text-subtle)]">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-[var(--ui-danger)]" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export type FormSectionProps = {
  title: string
  description?: string
  children: ReactNode
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <section className="space-y-4 rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-5">
      <div>
        <h3 className="text-sm font-semibold text-[var(--ui-text)]">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-[var(--ui-text-muted)]">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}
