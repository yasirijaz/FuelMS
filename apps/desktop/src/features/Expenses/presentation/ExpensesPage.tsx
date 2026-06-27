import { useState } from 'react'
import { Button, Card, CardBody, CardHeader, useToast } from '@fuelms/ui'
import { env } from '@shared/lib/env'
import {
  DEFAULT_EXPENSE_LIST_FILTERS,
  type ExpenseListFilters,
} from '../application/types/ExpenseListItem'
import {
  useExpenseList,
  useVoidExpense,
} from '../application/hooks/useExpenseQueries'
import { operatingExpenseRepositoryRuntime } from '../application/expenseModule'
import { ExpenseListTable } from './components/ExpenseListTable'
import { ExpenseListToolbar } from './components/ExpenseListToolbar'
import { RecordExpenseModal } from './components/RecordExpenseModal'

export function ExpensesPage() {
  const { toast } = useToast()
  const [filters, setFilters] = useState<ExpenseListFilters>(DEFAULT_EXPENSE_LIST_FILTERS)
  const [recordOpen, setRecordOpen] = useState(false)
  const { data: items = [], isLoading, isError, error } = useExpenseList(filters)
  const voidMutation = useVoidExpense()

  async function handleVoid(expenseId: string, version: number): Promise<void> {
    try {
      await voidMutation.mutateAsync({ expenseId, version })
      toast({ title: 'Expense voided', variant: 'success' })
    } catch (caught) {
      toast({
        title: 'Could not void expense',
        description: caught instanceof Error ? caught.message : undefined,
        variant: 'error',
      })
    }
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6 p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--ui-text)]">Expenses</h1>
          <p className="mt-1 text-sm text-[var(--ui-text-muted)]">
            Record operating costs. Paid expenses update cash balances automatically.
          </p>
        </div>
        <Button onClick={() => setRecordOpen(true)}>Record expense</Button>
      </header>

      {operatingExpenseRepositoryRuntime === 'browser' && !env.IS_TAURI && (
        <p className="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-4 py-2 text-sm text-[var(--ui-text-muted)]">
          Browser preview uses in-memory data. Run{' '}
          <code className="font-mono text-xs">pnpm tauri dev</code> for SQLite persistence.
        </p>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-[var(--ui-text)]">Expense list</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <ExpenseListToolbar filters={filters} onFiltersChange={setFilters} />
          {isError ? (
            <div className="rounded-[var(--ui-radius)] border border-[var(--ui-danger)]/30 bg-[var(--ui-danger)]/10 px-4 py-3 text-sm text-[var(--ui-danger)]">
              {error instanceof Error ? error.message : 'Failed to load expenses.'}
            </div>
          ) : (
            <ExpenseListTable
              items={items}
              isLoading={isLoading}
              onVoid={handleVoid}
              actionsPending={voidMutation.isPending}
            />
          )}
        </CardBody>
      </Card>

      <RecordExpenseModal open={recordOpen} onClose={() => setRecordOpen(false)} />
    </section>
  )
}
