import { useState } from 'react'
import { Button, Card, CardBody, CardHeader, useToast } from '@fuelms/ui'
import { env } from '@shared/lib/env'
import {
  DEFAULT_INCOME_LIST_FILTERS,
  type IncomeListFilters,
} from '../application/types/IncomeListItem'
import {
  useIncomeList,
  useVoidIncome,
} from '../application/hooks/useIncomeQueries'
import { operatingIncomeRepositoryRuntime } from '../application/incomeModule'
import { IncomeListTable } from './components/IncomeListTable'
import { IncomeListToolbar } from './components/IncomeListToolbar'
import { RecordIncomeModal } from './components/RecordIncomeModal'

export function IncomePage() {
  const { toast } = useToast()
  const [filters, setFilters] = useState<IncomeListFilters>(DEFAULT_INCOME_LIST_FILTERS)
  const [recordOpen, setRecordOpen] = useState(false)
  const { data: items = [], isLoading, isError, error } = useIncomeList(filters)
  const voidMutation = useVoidIncome()

  async function handleVoid(incomeId: string, version: number): Promise<void> {
    try {
      await voidMutation.mutateAsync({ incomeId, version })
      toast({ title: 'Income voided', variant: 'success' })
    } catch (caught) {
      toast({
        title: 'Could not void income',
        description: caught instanceof Error ? caught.message : undefined,
        variant: 'error',
      })
    }
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6 p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--ui-text)]">Income</h1>
          <p className="mt-1 text-sm text-[var(--ui-text-muted)]">
            Record non-fuel operating income. Received payments update cash balances automatically.
          </p>
        </div>
        <Button onClick={() => setRecordOpen(true)}>Record income</Button>
      </header>

      {operatingIncomeRepositoryRuntime === 'browser' && !env.IS_TAURI && (
        <p className="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-4 py-2 text-sm text-[var(--ui-text-muted)]">
          Browser preview uses in-memory data. Run{' '}
          <code className="font-mono text-xs">pnpm tauri dev</code> for SQLite persistence.
        </p>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-[var(--ui-text)]">Income list</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <IncomeListToolbar filters={filters} onFiltersChange={setFilters} />
          {isError ? (
            <div className="rounded-[var(--ui-radius)] border border-[var(--ui-danger)]/30 bg-[var(--ui-danger)]/10 px-4 py-3 text-sm text-[var(--ui-danger)]">
              {error instanceof Error ? error.message : 'Failed to load income.'}
            </div>
          ) : (
            <IncomeListTable
              items={items}
              isLoading={isLoading}
              onVoid={handleVoid}
              actionsPending={voidMutation.isPending}
            />
          )}
        </CardBody>
      </Card>

      <RecordIncomeModal open={recordOpen} onClose={() => setRecordOpen(false)} />
    </section>
  )
}
