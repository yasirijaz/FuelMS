import { formatMoneyDisplay, fuelProductDisplayName } from '@fuelms/shared'
import { Card, CardBody, CardHeader } from '@fuelms/ui'
import type { ActiveFuelPriceView } from '../../application/types/FuelPriceViews'

type ActivePricesPanelProps = {
  prices: ActiveFuelPriceView[]
}

export function ActivePricesPanel({ prices }: ActivePricesPanelProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {prices.map((price) => (
        <Card key={price.productCode}>
          <CardHeader>
            <h3 className="text-sm font-semibold text-[var(--ui-text)]">
              {fuelProductDisplayName(price.productCode)}
            </h3>
          </CardHeader>
          <CardBody>
            {price.priceMinorPerLitre != null ? (
              <div className="space-y-1">
                <p className="text-2xl font-semibold tabular-nums text-[var(--ui-text)]">
                  {formatMoneyDisplay(price.priceMinorPerLitre)}
                  <span className="ml-1 text-sm font-normal text-[var(--ui-text-muted)]">/ L</span>
                </p>
                {price.effectiveFromIso && (
                  <p className="text-xs text-[var(--ui-text-muted)]">
                    Since{' '}
                    {new Intl.DateTimeFormat('en-PK', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(price.effectiveFromIso))}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-[var(--ui-text-muted)]">No active price set</p>
            )}
          </CardBody>
        </Card>
      ))}
    </div>
  )
}
