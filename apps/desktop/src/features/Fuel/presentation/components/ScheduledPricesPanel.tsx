import { formatMoneyDisplay, fuelProductDisplayName } from '@fuelms/shared'
import { Button, Card, CardBody, CardHeader, EmptyState } from '@fuelms/ui'
import type { ScheduledFuelPriceView } from '../../application/types/FuelPriceViews'

type ScheduledPricesPanelProps = {
  prices: ScheduledFuelPriceView[]
  onCancel: (recordId: string) => void
  isCancelling?: boolean
}

export function ScheduledPricesPanel({
  prices,
  onCancel,
  isCancelling,
}: ScheduledPricesPanelProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-[var(--ui-text)]">Scheduled prices</h2>
        <p className="text-sm text-[var(--ui-text-muted)]">
          Future price changes waiting to take effect.
        </p>
      </CardHeader>
      <CardBody>
        {prices.length === 0 ? (
          <EmptyState
            title="No scheduled prices"
            description="Schedule a future price change when recording a new selling price."
          />
        ) : (
          <ul className="divide-y divide-[var(--ui-border)]">
            {prices.map((price) => (
              <li key={price.recordId} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-medium text-[var(--ui-text)]">
                    {fuelProductDisplayName(price.productCode)} ·{' '}
                    {formatMoneyDisplay(price.priceMinorPerLitre)} / L
                  </p>
                  <p className="mt-1 text-sm text-[var(--ui-text-muted)]">
                    Effective{' '}
                    {new Intl.DateTimeFormat('en-PK', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(price.effectiveFromIso))}
                  </p>
                  {price.reason && (
                    <p className="mt-1 text-xs text-[var(--ui-text-subtle)]">{price.reason}</p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={isCancelling}
                  onClick={() => onCancel(price.recordId)}
                >
                  Cancel
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  )
}
