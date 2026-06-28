import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, CardBody, CardHeader, useToast } from '@fuelms/ui'
import { env } from '@shared/lib/env'
import { formatDate } from '@shared/utils/format'
import { useSaleListPage } from '../application/hooks/useSaleList'
import {
  usePostSale,
  useSalesPeriodSummary,
  useTodaySalesSummary,
  useVoidSale,
} from '../application/hooks/useSaleQueries'
import { fuelSaleRepositoryRuntime } from '../application/saleModule'
import { SaleListTable } from './components/SaleListTable'
import { SaleListToolbar } from './components/SaleListToolbar'
import { RecordSaleModal } from './components/RecordSaleModal'
import { SalesPeriodCashPanel } from './components/SalesPeriodCashPanel'
import { TodaySalesPanel } from './components/TodaySalesPanel'

export function SalesPage() {
  const { toast } = useToast()
  const { filters, setFilters, items, isLoading, isError, error } = useSaleListPage()
  const [recordOpen, setRecordOpen] = useState(false)
  const postMutation = usePostSale()
  const voidMutation = useVoidSale()
  const todaySalesQuery = useTodaySalesSummary()
  const periodSummaryQuery = useSalesPeriodSummary(filters.fromDateIso, filters.toDateIso)

  async function handlePost(saleId: string, version: number): Promise<void> {
    try {
      await postMutation.mutateAsync({ saleId, version })
      toast({ title: 'Sale posted', variant: 'success' })
    } catch (caught) {
      toast({
        title: 'Could not post sale',
        description: caught instanceof Error ? caught.message : undefined,
        variant: 'error',
      })
    }
  }

  async function handleVoid(saleId: string, version: number): Promise<void> {
    try {
      await voidMutation.mutateAsync({ saleId, version })
      toast({ title: 'Sale voided', variant: 'success' })
    } catch (caught) {
      toast({
        title: 'Could not void sale',
        description: caught instanceof Error ? caught.message : undefined,
        variant: 'error',
      })
    }
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6 p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--ui-text)]">
            Fuel Sales
          </h1>
          <p className="mt-1 text-sm text-[var(--ui-text-muted)]">
            Record fuel sales and manage draft transactions.
          </p>
        </div>
        <Button onClick={() => setRecordOpen(true)}>New Sale</Button>
      </header>

      {fuelSaleRepositoryRuntime === 'browser' && !env.IS_TAURI && (
        <p className="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-4 py-2 text-sm text-[var(--ui-text-muted)]">
          Browser preview uses in-memory data. Run{' '}
          <code className="font-mono text-xs">pnpm tauri dev</code> for SQLite persistence.
        </p>
      )}

      <TodaySalesPanel
        summary={todaySalesQuery.data}
        isLoading={todaySalesQuery.isLoading}
        isError={todaySalesQuery.isError}
        error={todaySalesQuery.error}
      />

      <p className="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-4 py-3 text-sm text-[var(--ui-text-muted)]">
        Draft sales appear below. To include them in profit and the fuel T-ledger, click{' '}
        <span className="font-medium text-[var(--ui-text)]">Post</span> on each row — or check
        &quot;Post immediately&quot; when recording. View the debit/credit ledger under{' '}
        <Link to="/reports" className="font-medium text-[var(--ui-accent)] hover:underline">
          Reports → Fuel Ledger
        </Link>
        .
      </p>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-[var(--ui-text)]">Sale List</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <SaleListToolbar filters={filters} onFiltersChange={setFilters} />

          <SalesPeriodCashPanel
            summary={periodSummaryQuery.data}
            isLoading={periodSummaryQuery.isLoading}
          />

          {isError ? (
            <div className="rounded-[var(--ui-radius)] border border-[var(--ui-danger)]/30 bg-[var(--ui-danger)]/10 px-4 py-3 text-sm text-[var(--ui-danger)]">
              {error instanceof Error ? error.message : 'Failed to load sales.'}
            </div>
          ) : (
            <SaleListTable
              items={items}
              isLoading={isLoading}
              dateRangeLabel={`${formatDate(filters.fromDateIso)} – ${formatDate(filters.toDateIso)}`}
              onPost={handlePost}
              onVoid={handleVoid}
              actionsPending={postMutation.isPending || voidMutation.isPending}
            />
          )}
        </CardBody>
      </Card>

      <RecordSaleModal open={recordOpen} onClose={() => setRecordOpen(false)} />
    </section>
  )
}
