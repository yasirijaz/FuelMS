import { type ReactNode } from 'react'
import { cn } from '../lib/cn'

export function Table({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)]">
      <table className={cn('min-w-full border-collapse text-sm', className)}>{children}</table>
    </div>
  )
}

export function TableHeader({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-[var(--ui-surface-muted)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--ui-text-muted)]">
      {children}
    </thead>
  )
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-[var(--ui-border)] bg-[var(--ui-surface)]">{children}</tbody>
}

export function TableRow({
  children,
  className,
  onClick,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <tr
      className={cn(
        'transition-colors hover:bg-[var(--ui-surface-hover)]',
        onClick && 'cursor-pointer',
        className,
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}

export function TableHeadCell({
  children,
  className,
  align = 'left',
}: {
  children: ReactNode
  className?: string
  align?: 'left' | 'right' | 'center'
}) {
  return (
    <th
      className={cn(
        'px-4 py-3',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
      scope="col"
    >
      {children}
    </th>
  )
}

export function TableCell({
  children,
  className,
  align = 'left',
}: {
  children: ReactNode
  className?: string
  align?: 'left' | 'right' | 'center'
}) {
  return (
    <td
      className={cn(
        'px-4 py-3 text-[var(--ui-text)]',
        align === 'right' && 'text-right tabular-nums',
        align === 'center' && 'text-center',
        className,
      )}
    >
      {children}
    </td>
  )
}

export type DataTableColumn<T> = {
  id: string
  header: ReactNode
  cell: (row: T) => ReactNode
  align?: 'left' | 'right' | 'center'
  className?: string
}

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[]
  data: T[]
  getRowId: (row: T) => string
  isLoading?: boolean
  emptyState?: ReactNode
  onRowClick?: (row: T) => void
}

export function DataTable<T>({
  columns,
  data,
  getRowId,
  isLoading,
  emptyState,
  onRowClick,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="space-y-2 rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] p-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-10 animate-pulse rounded bg-[var(--ui-surface-hover)]" />
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return <>{emptyState ?? null}</>
  }

  return (
    <Table>
      <TableHeader>
        <tr>
          {columns.map((column) => (
            <TableHeadCell key={column.id} align={column.align} className={column.className}>
              {column.header}
            </TableHeadCell>
          ))}
        </tr>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow key={getRowId(row)} onClick={onRowClick ? () => onRowClick(row) : undefined}>
            {columns.map((column) => (
              <TableCell key={column.id} align={column.align} className={column.className}>
                {column.cell(row)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
