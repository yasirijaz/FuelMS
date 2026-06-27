import { formatMoneyDisplay } from '@fuelms/shared'
import { Card, CardBody, CardHeader } from '@fuelms/ui'
import type { CashAccountListItem } from '../../application/mappers/cashViewMappers'

type CashAccountCardProps = {
  account: CashAccountListItem
  onEdit?: (account: CashAccountListItem) => void
}

export function CashAccountCard({ account, onEdit }: CashAccountCardProps) {
  return (
    <Card className="border-l-4 border-l-emerald-500">
      <CardHeader className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-text-subtle)]">
            {account.accountTypeLabel}
          </p>
          <h3 className="mt-1 text-base font-semibold text-[var(--ui-text)]">{account.name}</h3>
        </div>
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(account)}
            className="text-xs font-medium text-[var(--ui-accent)] hover:underline"
          >
            Edit
          </button>
        )}
      </CardHeader>
      <CardBody>
        <p className="text-2xl font-semibold tabular-nums tracking-tight text-[var(--ui-text)]">
          {formatMoneyDisplay(account.balanceMinor)}
        </p>
        {account.notes && (
          <p className="mt-2 text-xs text-[var(--ui-text-muted)]">{account.notes}</p>
        )}
      </CardBody>
    </Card>
  )
}
