import { formatFuelQuantity, fuelProductDisplayName } from '@fuelms/shared'
import type { MovementListItem } from '../../application/mappers/inventoryViewMappers'

type MovementListPanelProps = {
  movements: MovementListItem[]
  isLoading?: boolean
}

export function MovementListPanel({ movements, isLoading }: MovementListPanelProps) {
  if (isLoading) {
    return <p className="text-sm text-[var(--ui-text-muted)]">Loading movements…</p>
  }

  if (movements.length === 0) {
    return <p className="text-sm text-[var(--ui-text-muted)]">No stock movements yet.</p>
  }

  return (
    <ul className="divide-y divide-[var(--ui-border)]">
      {movements.map((movement) => {
        const isReceipt = movement.kind === 'receipt'
        const signedQty = movement.quantityLitres

        return (
          <li
            key={movement.id}
            className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-medium text-[var(--ui-text)]">
                {movement.referenceLabel}
              </p>
              <p className="text-xs text-[var(--ui-text-muted)]">
                {fuelProductDisplayName(movement.productCode)} ·{' '}
                {new Intl.DateTimeFormat('en-PK', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(movement.occurredAtIso))}
              </p>
            </div>
            <p
              className={`text-sm font-semibold tabular-nums ${
                isReceipt ? 'text-[var(--ui-success)]' : 'text-[var(--ui-danger)]'
              }`}
            >
              {isReceipt ? '+' : ''}
              {formatFuelQuantity(signedQty)}
            </p>
          </li>
        )
      })}
    </ul>
  )
}
