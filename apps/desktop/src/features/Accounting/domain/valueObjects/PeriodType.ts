export const PERIOD_TYPES = ['month'] as const
export type PeriodType = (typeof PERIOD_TYPES)[number]

export function isPeriodType(value: string): value is PeriodType {
  return (PERIOD_TYPES as readonly string[]).includes(value)
}
