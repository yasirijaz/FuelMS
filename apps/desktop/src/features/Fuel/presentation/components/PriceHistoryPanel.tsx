import { useState } from 'react'
import type { FuelProductCode } from '@fuelms/shared'
import { Card, CardBody, CardHeader, FuelProductSelector, LoadingState, PriceHistoryTimeline } from '@fuelms/ui'
import { useFuelPriceHistory } from '../../application/hooks/useFuelPriceQueries'

export function PriceHistoryPanel() {
  const [productCode, setProductCode] = useState<FuelProductCode>('diesel')
  const { data, isLoading, isError, error } = useFuelPriceHistory({
    productCode,
    limit: 50,
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--ui-text)]">Price history</h2>
            <p className="text-sm text-[var(--ui-text-muted)]">
              Complete audit trail of selling price changes.
            </p>
          </div>
          <FuelProductSelector
            mode="segmented"
            label="Product"
            value={productCode}
            onChange={(code) => {
              if (code) setProductCode(code)
            }}
          />
        </div>
      </CardHeader>
      <CardBody>
        {isLoading && <LoadingState />}
        {isError && (
          <p className="text-sm text-[var(--ui-danger)]">
            {error instanceof Error ? error.message : 'History unavailable.'}
          </p>
        )}
        {data && <PriceHistoryTimeline entries={data} />}
      </CardBody>
    </Card>
  )
}
