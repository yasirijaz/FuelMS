import { useState } from 'react'
import { Button, Card, CardBody, CardHeader, useToast } from '@fuelms/ui'
import { env } from '@shared/lib/env'
import { usePurchaseList } from '../application/hooks/usePurchaseList'
import {
  usePostPurchase,
  useVoidPurchase,
} from '../application/hooks/usePurchaseQueries'
import { fuelPurchaseRepositoryRuntime } from '../application/purchaseModule'
import { PurchaseListTable } from './components/PurchaseListTable'
import { PurchaseListToolbar } from './components/PurchaseListToolbar'
import { RecordPurchaseModal } from './components/RecordPurchaseModal'

export function PurchasesPage() {
  const { toast } = useToast()
  const { filters, setFilters, items, isLoading, isError, error } = usePurchaseList()
  const [recordOpen, setRecordOpen] = useState(false)
  const postMutation = usePostPurchase()
  const voidMutation = useVoidPurchase()

  async function handlePost(purchaseId: string, version: number): Promise<void> {
    try {
      await postMutation.mutateAsync({ purchaseId, version })
      toast({ title: 'Purchase posted', variant: 'success' })
    } catch (caught) {
      toast({
        title: 'Could not post purchase',
        description: caught instanceof Error ? caught.message : undefined,
        variant: 'error',
      })
    }
  }

  async function handleVoid(purchaseId: string, version: number): Promise<void> {
    try {
      await voidMutation.mutateAsync({ purchaseId, version })
      toast({ title: 'Purchase voided', variant: 'success' })
    } catch (caught) {
      toast({
        title: 'Could not void purchase',
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
            Fuel Purchases
          </h1>
          <p className="mt-1 text-sm text-[var(--ui-text-muted)]">
            Record fuel deliveries and manage draft purchases.
          </p>
        </div>
        <Button onClick={() => setRecordOpen(true)}>New Purchase</Button>
      </header>

      {fuelPurchaseRepositoryRuntime === 'browser' && !env.IS_TAURI && (
        <p className="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-4 py-2 text-sm text-[var(--ui-text-muted)]">
          Browser preview uses in-memory data. Run{' '}
          <code className="font-mono text-xs">pnpm tauri dev</code> for SQLite persistence.
        </p>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-[var(--ui-text)]">Purchase List</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <PurchaseListToolbar filters={filters} onFiltersChange={setFilters} />

          {isError ? (
            <div className="rounded-[var(--ui-radius)] border border-[var(--ui-danger)]/30 bg-[var(--ui-danger)]/10 px-4 py-3 text-sm text-[var(--ui-danger)]">
              {error instanceof Error ? error.message : 'Failed to load purchases.'}
            </div>
          ) : (
            <PurchaseListTable
              items={items}
              isLoading={isLoading}
              onPost={handlePost}
              onVoid={handleVoid}
              actionsPending={postMutation.isPending || voidMutation.isPending}
            />
          )}
        </CardBody>
      </Card>

      <RecordPurchaseModal open={recordOpen} onClose={() => setRecordOpen(false)} />
    </section>
  )
}
