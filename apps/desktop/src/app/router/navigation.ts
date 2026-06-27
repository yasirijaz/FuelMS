import type { NavSection } from '@shared/types/navigation'

/** Sidebar structure — order and grouping only; routes registered in routes.tsx. */
export const navigationSections: NavSection[] = [
  {
    kind: 'link',
    item: { path: 'dashboard', label: 'Dashboard' },
  },
  {
    kind: 'group',
    label: 'Operations',
    items: [
      { path: 'fuel-prices', label: 'Fuel Prices' },
      { path: 'purchases', label: 'Purchases' },
      { path: 'sales', label: 'Sales' },
      { path: 'inventory', label: 'Inventory' },
      { path: 'tanks', label: 'Tanks' },
    ],
  },
  {
    kind: 'group',
    label: 'Finance',
    items: [
      { path: 'cash', label: 'Cash' },
      { path: 'expenses', label: 'Expenses' },
      { path: 'income', label: 'Income' },
      { path: 'person-ledger', label: 'Person Ledger' },
      { path: 'accounting', label: 'Accounting' },
    ],
  },
  {
    kind: 'link',
    item: { path: 'reports', label: 'Reports' },
  },
  {
    kind: 'link',
    item: { path: 'business-partners', label: 'Business Partners' },
  },
  {
    kind: 'link',
    item: { path: 'backup', label: 'Backup' },
  },
  {
    kind: 'link',
    item: { path: 'settings', label: 'Settings' },
  },
]

export const NAV_ICONS: Record<string, string> = {
  dashboard: '◉',
  'fuel-prices': '⛽',
  purchases: '🛢',
  sales: '🧾',
  inventory: '📦',
  tanks: '🛢',
  cash: '💵',
  expenses: '💸',
  income: '💰',
  'person-ledger': '👥',
  accounting: '⊞',
  reports: '📊',
  'business-partners': '🤝',
  backup: '💾',
  settings: '⚙',
}
