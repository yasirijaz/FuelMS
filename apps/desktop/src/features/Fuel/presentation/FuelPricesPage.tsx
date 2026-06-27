import { LoadingState, ErrorState, useConfirm, useToast } from '@fuelms/ui'
import { env } from '@shared/lib/env'
import {
  useCancelScheduledFuelPrice,
  useFuelPriceOverview,
} from '../application/hooks/useFuelPriceQueries'
import { fuelPriceRepositoryRuntime } from '../application/fuelPriceModule'
import { ActivePricesPanel } from './components/ActivePricesPanel'
import { RecordFuelPriceForm } from './components/RecordFuelPriceForm'
import { ScheduledPricesPanel } from './components/ScheduledPricesPanel'
import { PriceHistoryPanel } from './components/PriceHistoryPanel'

export function FuelPricesPage() {
  const { data, isLoading, isError, error } = useFuelPriceOverview()
  const cancelMutation = useCancelScheduledFuelPrice()
  const confirm = useConfirm()
  const { toast } = useToast()

  if (isLoading) {
    return <LoadingState className="m-8" />
  }

  if (isError || !data) {
    return (
      <ErrorState
        className="m-8"
        title="Fuel prices unavailable"
        description={error instanceof Error ? error.message : 'Could not load prices.'}
      />
    )
  }

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ui-text-subtle)]">
          Fuel
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--ui-text)]">
          Fuel Prices
        </h1>
        <p className="max-w-3xl text-sm text-[var(--ui-text-muted)]">
          Manage selling prices for petrol, diesel, and HOBC. Changes apply to future sales only —
          past sales keep the price that was active at the time of sale.
        </p>
        {env.IS_DEV && fuelPriceRepositoryRuntime === 'browser' && (
          <p className="text-xs text-amber-700">
            Browser mode — prices are stored in memory until you run the Tauri app.
          </p>
        )}
      </header>

      <ActivePricesPanel prices={data.activePrices} />

      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <RecordFuelPriceForm
          onSuccess={() => {
            toast({ title: 'Price saved', variant: 'success' })
          }}
        />
        <ScheduledPricesPanel
          prices={data.scheduledPrices}
          isCancelling={cancelMutation.isPending}
          onCancel={async (recordId) => {
            const confirmed = await confirm({
              title: 'Cancel scheduled price?',
              description: 'This scheduled price change will not take effect.',
              confirmLabel: 'Cancel price',
              variant: 'danger',
            })
            if (!confirmed) return
            await cancelMutation.mutateAsync(recordId)
            toast({ title: 'Scheduled price cancelled', variant: 'success' })
          }}
        />
      </div>

      <PriceHistoryPanel />
    </section>
  )
}
