export const INCOME_CATEGORIES = [
  'rent',
  'property',
  'commission',
  'service',
  'other',
] as const

export type IncomeCategory = (typeof INCOME_CATEGORIES)[number]

export function incomeCategoryLabel(code: IncomeCategory): string {
  switch (code) {
    case 'rent':
      return 'Rent'
    case 'property':
      return 'Property'
    case 'commission':
      return 'Commission'
    case 'service':
      return 'Service'
    case 'other':
      return 'Other'
  }
}
