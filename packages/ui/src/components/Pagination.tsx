import { Button } from './Button'
import { cn } from '../lib/cn'

export type PaginationProps = {
  page: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  className?: string
}

function pageRange(page: number, totalPages: number): number[] {
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, page + 2)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

export function Pagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalItems)

  return (
    <nav
      className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}
      aria-label="Pagination"
    >
      <p className="text-sm text-[var(--ui-text-muted)]">
        Showing <span className="font-medium text-[var(--ui-text)]">{from}</span>–
        <span className="font-medium text-[var(--ui-text)]">{to}</span> of{' '}
        <span className="font-medium text-[var(--ui-text)]">{totalItems}</span>
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          Previous
        </Button>

        {pageRange(page, totalPages).map((pageNumber) => (
          <Button
            key={pageNumber}
            variant={pageNumber === page ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onPageChange(pageNumber)}
            aria-label={`Page ${pageNumber}`}
            aria-current={pageNumber === page ? 'page' : undefined}
          >
            {pageNumber}
          </Button>
        ))}

        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          Next
        </Button>
      </div>
    </nav>
  )
}
