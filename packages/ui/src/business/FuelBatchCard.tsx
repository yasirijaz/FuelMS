import {
  formatFuelQuantity,
  formatMoneyDisplay,
  fuelProductDisplayName,
  type FuelBatchSummary,
} from '@fuelms/shared'
import { cn } from '../lib/cn'
import { Card, CardBody, CardHeader } from '../components/Card'

export type FuelBatchCardProps = {
  batch: FuelBatchSummary
  onSelect?: (batchId: string) => void
  className?: string
}

export function FuelBatchCard({ batch, onSelect, className }: FuelBatchCardProps) {
  const consumed = batch.quantityLitres - batch.remainingLitres
  const usedPercent =
    batch.quantityLitres > 0 ? Math.round((consumed / batch.quantityLitres) * 100) : 0

  const content = (
    <>
      <CardHeader className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-text-subtle)]">
            {fuelProductDisplayName(batch.productCode)}
          </p>
          <h3 className="mt-1 text-sm font-semibold text-[var(--ui-text)]">Batch {batch.id}</h3>
        </div>
        {batch.unitCostMinorPerLitre != null && (
          <p className="text-sm tabular-nums text-[var(--ui-text-muted)]">
            {formatMoneyDisplay(batch.unitCostMinorPerLitre)}/L
          </p>
        )}
      </CardHeader>
      <CardBody className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-[var(--ui-text-subtle)]">Received</p>
            <p className="font-medium tabular-nums">{formatFuelQuantity(batch.quantityLitres)}</p>
          </div>
          <div>
            <p className="text-[var(--ui-text-subtle)]">Remaining</p>
            <p className="font-medium tabular-nums">{formatFuelQuantity(batch.remainingLitres)}</p>
          </div>
        </div>
        <div>
          <div className="mb-1 flex justify-between text-xs text-[var(--ui-text-muted)]">
            <span>Consumed</span>
            <span>{usedPercent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--ui-surface-muted)]">
            <div
              className="h-full rounded-full bg-[var(--ui-accent)]"
              style={{ width: `${usedPercent}%` }}
            />
          </div>
        </div>
        {batch.supplierName && (
          <p className="text-xs text-[var(--ui-text-muted)]">Supplier: {batch.supplierName}</p>
        )}
        <p className="text-xs text-[var(--ui-text-subtle)]">
          Received{' '}
          {new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium' }).format(
            new Date(batch.receivedAtIso),
          )}
        </p>
      </CardBody>
    </>
  )

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={() => onSelect(batch.id)}
        className={cn(
          'w-full text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-ring)]',
          className,
        )}
      >
        <Card>{content}</Card>
      </button>
    )
  }

  return <Card className={className}>{content}</Card>
}
