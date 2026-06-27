import { formatMoneyDisplay, type MoneyMinor } from '@fuelms/shared'
import { cn } from '../lib/cn'
import { Card, CardBody } from '../components/Card'

export type MetricCardProps = {
  label: string
  amountMinor: MoneyMinor
  trendPercent?: number
  trendLabel?: string
  className?: string
}

function Trend({ value, label }: { value: number; label?: string }) {
  const positive = value >= 0
  return (
    <p
      className={cn(
        'mt-2 text-xs font-medium',
        positive ? 'text-emerald-700' : 'text-red-700',
      )}
    >
      {positive ? '▲' : '▼'} {Math.abs(value).toFixed(1)}%
      {label ? ` ${label}` : ''}
    </p>
  )
}

export function ProfitCard({
  label = "Today's profit",
  amountMinor,
  trendPercent,
  trendLabel = 'vs yesterday',
  className,
}: MetricCardProps) {
  return (
    <Card className={className}>
      <CardBody>
        <p className="text-sm font-medium text-[var(--ui-text-muted)]">{label}</p>
        <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-[var(--ui-text)]">
          {formatMoneyDisplay(amountMinor)}
        </p>
        {trendPercent != null && <Trend value={trendPercent} label={trendLabel} />}
      </CardBody>
    </Card>
  )
}

export function CashBalanceCard({
  label = 'Cash balance',
  amountMinor,
  trendPercent,
  trendLabel,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn('border-l-4 border-l-emerald-500', className)}>
      <CardBody>
        <p className="text-sm font-medium text-[var(--ui-text-muted)]">{label}</p>
        <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-[var(--ui-text)]">
          {formatMoneyDisplay(amountMinor)}
        </p>
        {trendPercent != null && <Trend value={trendPercent} label={trendLabel} />}
        <p className="mt-2 text-xs text-[var(--ui-text-subtle)]">Drawer + bank cash on hand</p>
      </CardBody>
    </Card>
  )
}
