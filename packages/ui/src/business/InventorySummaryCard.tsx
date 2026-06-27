import {
  formatFuelQuantity,
  formatMoneyDisplay,
  fuelProductDisplayName,
  FUEL_PRODUCT_COLORS,
  type InventoryProductSummary,
} from '@fuelms/shared'
import { Card, CardBody, CardHeader } from '../components/Card'

export type InventorySummaryCardProps = {
  title?: string
  products: InventoryProductSummary[]
  totalValuationMinor?: number
  className?: string
}

export function InventorySummaryCard({
  title = 'Fuel inventory',
  products,
  totalValuationMinor,
  className,
}: InventorySummaryCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[var(--ui-text)]">{title}</h3>
        {totalValuationMinor != null && (
          <p className="text-sm font-medium tabular-nums text-[var(--ui-text-muted)]">
            {formatMoneyDisplay(totalValuationMinor)}
          </p>
        )}
      </CardHeader>
      <CardBody className="space-y-3">
        {products.length === 0 ? (
          <p className="text-sm text-[var(--ui-text-muted)]">No stock on hand.</p>
        ) : (
          <ul className="space-y-2">
            {products.map((item) => (
              <li
                key={item.productCode}
                className="flex items-center justify-between gap-3 rounded-[var(--ui-radius)] bg-[var(--ui-surface-muted)] px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: FUEL_PRODUCT_COLORS[item.productCode] }}
                    aria-hidden
                  />
                  <span className="text-sm font-medium text-[var(--ui-text)]">
                    {fuelProductDisplayName(item.productCode)}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm tabular-nums text-[var(--ui-text)]">
                    {formatFuelQuantity(item.quantityLitres)}
                  </p>
                  {item.valuationMinor != null && (
                    <p className="text-xs tabular-nums text-[var(--ui-text-subtle)]">
                      {formatMoneyDisplay(item.valuationMinor)}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  )
}
