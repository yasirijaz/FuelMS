export const NORMAL_BALANCES = ['debit', 'credit'] as const
export type NormalBalance = (typeof NORMAL_BALANCES)[number]

export function isNormalBalance(value: string): value is NormalBalance {
  return (NORMAL_BALANCES as readonly string[]).includes(value)
}
