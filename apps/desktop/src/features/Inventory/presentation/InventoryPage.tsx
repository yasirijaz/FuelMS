import { useMemo, useState } from 'react'
import { Card, CardBody, CardHeader, FuelBatchCard, InventorySummaryCard } from '@fuelms/ui'
import { env } from '@shared/lib/env'
import type { FuelProductCode } from '@fuelms/shared'
import {
  useInventoryBatches,
  useInventoryMovements,
  useInventorySummary,
} from '../application/hooks/useInventoryQueries'
import { inventoryRepositoryRuntime } from '../application/inventoryModule'
import { MovementListPanel } from './components/MovementListPanel'
import { ProductFilter } from './components/ProductFilter'

export function InventoryPage() {
  const [productCode, setProductCode] = useState<FuelProductCode | undefined>()
  const summaryQuery = useInventorySummary()
  const batchesQuery = useInventoryBatches(productCode, true)
  const movementsQuery = useInventoryMovements(productCode, 50)

  const totalValuationMinor = useMemo(() => {
    if (!summaryQuery.data) return 0
    return summaryQuery.data.reduce((sum, item) => sum + (item.valuationMinor ?? 0), 0)
  }, [summaryQuery.data])

  return (
    <section className="mx-auto max-w-5xl space-y-6 p-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--ui-text)]">
          Inventory
        </h1>
        <p className="mt-1 text-sm text-[var(--ui-text-muted)]">
          FIFO stock on hand, batch valuation, and movement history (read-only).
        </p>
      </header>

      {inventoryRepositoryRuntime === 'browser' && !env.IS_TAURI && (
        <p className="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-4 py-2 text-sm text-[var(--ui-text-muted)]">
          Browser preview uses in-memory data. Run{' '}
          <code className="font-mono text-xs">pnpm tauri dev</code> for SQLite persistence.
        </p>
      )}

      {summaryQuery.isError && (
        <div className="rounded-[var(--ui-radius)] border border-[var(--ui-danger)]/30 bg-[var(--ui-danger)]/10 px-4 py-3 text-sm text-[var(--ui-danger)]">
          {summaryQuery.error instanceof Error
            ? summaryQuery.error.message
            : 'Failed to load inventory summary.'}
        </div>
      )}

      <InventorySummaryCard
        products={summaryQuery.data ?? []}
        totalValuationMinor={totalValuationMinor}
        className={summaryQuery.isLoading ? 'opacity-60' : undefined}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ProductFilter value={productCode} onChange={setProductCode} />
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-[var(--ui-text)]">Active batches (FIFO)</h2>
        </CardHeader>
        <CardBody>
          {batchesQuery.isError ? (
            <p className="text-sm text-[var(--ui-danger)]">
              {batchesQuery.error instanceof Error
                ? batchesQuery.error.message
                : 'Failed to load batches.'}
            </p>
          ) : batchesQuery.isLoading ? (
            <p className="text-sm text-[var(--ui-text-muted)]">Loading batches…</p>
          ) : batchesQuery.data?.length === 0 ? (
            <p className="text-sm text-[var(--ui-text-muted)]">No active batches for this filter.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {batchesQuery.data?.map((batch) => (
                <FuelBatchCard key={batch.id} batch={batch} />
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-[var(--ui-text)]">Stock movements</h2>
        </CardHeader>
        <CardBody>
          {movementsQuery.isError ? (
            <p className="text-sm text-[var(--ui-danger)]">
              {movementsQuery.error instanceof Error
                ? movementsQuery.error.message
                : 'Failed to load movements.'}
            </p>
          ) : (
            <MovementListPanel
              movements={movementsQuery.data ?? []}
              isLoading={movementsQuery.isLoading}
            />
          )}
        </CardBody>
      </Card>
    </section>
  )
}
