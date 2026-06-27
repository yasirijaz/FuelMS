import { type ReactNode } from 'react'
import { cn } from '../lib/cn'

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block size-5 animate-spin rounded-full border-2 border-[var(--ui-border-strong)] border-t-[var(--ui-accent)]',
        className,
      )}
      role="status"
      aria-label="Loading"
    />
  )
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-[var(--ui-radius)] bg-[var(--ui-surface-hover)]',
        className,
      )}
      aria-hidden
    />
  )
}

export type LoadingStateProps = {
  title?: string
  description?: string
  className?: string
}

export function LoadingState({
  title = 'Loading',
  description = 'Please wait…',
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-[var(--ui-radius-lg)] border border-dashed border-[var(--ui-border)] bg-[var(--ui-surface)] px-6 py-16 text-center',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Spinner />
      <div>
        <p className="text-sm font-medium text-[var(--ui-text)]">{title}</p>
        <p className="mt-1 text-sm text-[var(--ui-text-muted)]">{description}</p>
      </div>
    </div>
  )
}

export type EmptyStateProps = {
  title: string
  description?: string
  action?: ReactNode
  icon?: ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-[var(--ui-radius-lg)] border border-dashed border-[var(--ui-border)] bg-[var(--ui-surface)] px-6 py-16 text-center',
        className,
      )}
    >
      {icon && <div className="text-2xl text-[var(--ui-text-subtle)]">{icon}</div>}
      <div>
        <p className="text-sm font-medium text-[var(--ui-text)]">{title}</p>
        {description && (
          <p className="mt-1 max-w-sm text-sm text-[var(--ui-text-muted)]">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}

export type ErrorStateProps = {
  title?: string
  description: string
  action?: ReactNode
  className?: string
}

export function ErrorState({
  title = 'Something went wrong',
  description,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--ui-radius-lg)] border border-[var(--ui-danger-border)] bg-[var(--ui-danger-bg)] px-6 py-8',
        className,
      )}
      role="alert"
    >
      <p className="text-sm font-semibold text-[var(--ui-danger)]">{title}</p>
      <p className="mt-1 text-sm text-[var(--ui-text-muted)]">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
