import { Navigate, type RouteObject } from 'react-router-dom'
import { AppLayout } from '@app/layouts/AppLayout'
import { AccountingPage } from '@features/Accounting/presentation/AccountingPage'
import { ExpensesPage } from '@features/Expenses/presentation/ExpensesPage'
import { FuelPage } from '@features/Fuel/presentation/FuelPage'
import { IncomePage } from '@features/Income/presentation/IncomePage'
import { InventoryPage } from '@features/Inventory/presentation/InventoryPage'
import { PersonsPage } from '@features/Persons/presentation/PersonsPage'
import { ReportsPage } from '@features/Reports/presentation/ReportsPage'
import { SettingsPage } from '@features/Settings/presentation/SettingsPage'
import type { AppRoute } from '@shared/types/navigation'

export const featureRoutes = [
  {
    path: 'accounting',
    label: 'Accounting',
    description: 'Financial controls and ledger boundaries.',
    Component: AccountingPage,
  },
  {
    path: 'fuel',
    label: 'Fuel',
    description: 'Fuel operations and product boundaries.',
    Component: FuelPage,
  },
  {
    path: 'inventory',
    label: 'Inventory',
    description: 'Stock movement and valuation boundaries.',
    Component: InventoryPage,
  },
  {
    path: 'expenses',
    label: 'Expenses',
    description: 'Operating expense boundaries.',
    Component: ExpensesPage,
  },
  {
    path: 'income',
    label: 'Income',
    description: 'Revenue and receipt boundaries.',
    Component: IncomePage,
  },
  {
    path: 'persons',
    label: 'Persons',
    description: 'People, parties, and relationship boundaries.',
    Component: PersonsPage,
  },
  {
    path: 'reports',
    label: 'Reports',
    description: 'Operational and financial reporting boundaries.',
    Component: ReportsPage,
  },
  {
    path: 'settings',
    label: 'Settings',
    description: 'Application configuration boundaries.',
    Component: SettingsPage,
  },
] satisfies AppRoute[]

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/accounting" replace /> },
      ...featureRoutes.map(({ path, Component }) => ({
        path,
        element: <Component />,
      })),
    ],
  },
]
