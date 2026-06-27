import { formatFuelQuantity } from '@fuelms/shared'
import { Card, CardBody, CardHeader, TankVisual } from '@fuelms/ui'
import type { TankListItem } from '../../application/mappers/tankViewMappers'

type TankCardProps = {
  tank: TankListItem
  onEdit: (tank: TankListItem) => void
  onRecordDip: (tank: TankListItem) => void
}

export function TankCard({ tank, onEdit, onRecordDip }: TankCardProps) {
  const hasVariance = tank.varianceLitres != null && Math.abs(tank.varianceLitres) > 0.001
  const variancePositive = (tank.varianceLitres ?? 0) > 0

  return (
    <Card>
      <CardHeader className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[var(--ui-text)]">{tank.name}</h3>
          {!tank.isActive && (
            <span className="mt-1 inline-block rounded-full bg-[var(--ui-surface-muted)] px-2 py-0.5 text-xs text-[var(--ui-text-muted)]">
              Inactive
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(tank)}
            className="text-xs font-medium text-[var(--ui-accent)] hover:underline"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onRecordDip(tank)}
            className="text-xs font-medium text-[var(--ui-accent)] hover:underline"
          >
            Record dip
          </button>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        <TankVisual
          productCode={tank.productCode}
          fillPercent={tank.fillPercent}
          capacityLitres={tank.capacityLitres}
          currentLitres={tank.bookLitres}
          size="sm"
        />

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-[var(--ui-text-subtle)]">Book stock</p>
            <p className="font-medium tabular-nums">{formatFuelQuantity(tank.bookLitres)}</p>
          </div>
          <div>
            <p className="text-[var(--ui-text-subtle)]">Last dip</p>
            <p className="font-medium tabular-nums">
              {tank.lastDipLitres != null
                ? formatFuelQuantity(tank.lastDipLitres)
                : '—'}
            </p>
          </div>
        </div>

        {hasVariance && (
          <div
            className="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-3 py-2 text-xs"
            role="status"
          >
            <p className="font-medium text-[var(--ui-text)]">Reconciliation variance (informational)</p>
            <p className="mt-1 tabular-nums text-[var(--ui-text-muted)]">
              Dip vs book:{' '}
              <span
                className={
                  variancePositive ? 'text-[var(--ui-success)]' : 'text-[var(--ui-danger)]'
                }
              >
                {variancePositive ? '+' : ''}
                {formatFuelQuantity(tank.varianceLitres!)}
              </span>
            </p>
            {tank.lastDipAtIso && (
              <p className="mt-1 text-[var(--ui-text-subtle)]">
                Last dip{' '}
                {new Intl.DateTimeFormat('en-PK', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(tank.lastDipAtIso))}
              </p>
            )}
            <p className="mt-1 text-[var(--ui-text-subtle)]">
              Book inventory is not adjusted from dips.
            </p>
          </div>
        )}

        {tank.notes && (
          <p className="text-xs text-[var(--ui-text-muted)]">Notes: {tank.notes}</p>
        )}
      </CardBody>
    </Card>
  )
}
