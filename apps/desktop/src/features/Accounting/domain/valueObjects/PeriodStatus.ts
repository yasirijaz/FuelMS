export const PERIOD_STATUSES = ['open', 'closed'] as const
export type PeriodStatus = (typeof PERIOD_STATUSES)[number]

export const PERIOD_STATUS_LABELS: Record<PeriodStatus, string> = {
  open: 'Open',
  closed: 'Closed',
}

export function isPeriodStatus(value: string): value is PeriodStatus {
  return (PERIOD_STATUSES as readonly string[]).includes(value)
}
