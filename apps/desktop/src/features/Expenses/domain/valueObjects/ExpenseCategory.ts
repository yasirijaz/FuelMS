export const EXPENSE_CATEGORIES = [
  'maintenance',
  'electricity',
  'salary',
  'generator',
  'transport',
  'stationery',
  'vehicle_repair',
  'other',
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

export function expenseCategoryLabel(code: ExpenseCategory): string {
  switch (code) {
    case 'maintenance':
      return 'Maintenance'
    case 'electricity':
      return 'Electricity'
    case 'salary':
      return 'Salary'
    case 'generator':
      return 'Generator'
    case 'transport':
      return 'Transport'
    case 'stationery':
      return 'Stationery'
    case 'vehicle_repair':
      return 'Vehicle Repair'
    case 'other':
      return 'Other'
  }
}
