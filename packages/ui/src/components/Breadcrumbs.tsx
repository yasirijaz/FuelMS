import { Link } from 'react-router-dom'
import { cn } from '../lib/cn'

export type BreadcrumbItem = {
  label: string
  href?: string
}

export type BreadcrumbsProps = {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className={cn('text-sm', className)}>
      <ol className="flex flex-wrap items-center gap-1.5 text-[var(--ui-text-muted)]">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
              {index > 0 && (
                <span className="text-[var(--ui-text-subtle)]" aria-hidden>
                  /
                </span>
              )}
              {item.href && !isLast ? (
                <Link
                  to={item.href}
                  className="rounded px-1 py-0.5 transition-colors hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-text)]"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(isLast && 'font-medium text-[var(--ui-text)]')}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
