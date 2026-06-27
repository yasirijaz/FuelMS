import { Navigate, type RouteObject } from 'react-router-dom'
import { AppShell } from '@app/shell/AppShell'
import { AccountingPage } from '@features/Accounting/presentation/AccountingPage'
import { BackupPage } from '@features/Backup/presentation/BackupPage'
import { BusinessPartnersPage } from '@features/BusinessPartners/presentation/BusinessPartnersPage'
import { CashPage } from '@features/Cash/presentation/CashPage'
import { DashboardPage } from '@features/Dashboard/presentation/DashboardPage'
import { ExpensesPage } from '@features/Expenses/presentation/ExpensesPage'
import { FuelPricesPage } from '@features/Fuel/presentation/FuelPricesPage'
import { HealthCheckPage } from '@features/HealthCheck/presentation/HealthCheckPage'
import { IncomePage } from '@features/Income/presentation/IncomePage'
import { InventoryPage } from '@features/Inventory/presentation/InventoryPage'
import { PersonLedgerPage } from '@features/Persons/presentation/PersonLedgerPage'
import { PurchasesPage } from '@features/Purchases/presentation/PurchasesPage'
import { ReportsPage } from '@features/Reports/presentation/ReportsPage'
import { SalesPage } from '@features/Sales/presentation/SalesPage'
import { SettingsPage } from '@features/Settings/presentation/SettingsPage'
import { TanksPage } from '@features/Tanks/presentation/TanksPage'
import { UiFoundationPage } from '@features/UiFoundation/presentation/UiFoundationPage'
import type { AppRoute } from '@shared/types/navigation'

/**
 * appRoutes — registered React Router paths.
 *
 * Sidebar order and grouping live in navigation.ts.
 * `_hidden` excludes a route from the sidebar (health check, legacy redirects).
 */
export const appRoutes = [
  {
    path: '_health',
    label: 'Health Check',
    description: 'Architecture and infrastructure health verification.',
    Component: HealthCheckPage,
    _hidden: true,
  },
  {
    path: '_ui',
    label: 'UI Foundation',
    description: 'Design system component showcase.',
    Component: UiFoundationPage,
    _hidden: true,
  },
  {
    path: 'dashboard',
    label: 'Dashboard',
    description: 'Daily operations overview and quick actions.',
    Component: DashboardPage,
  },
  {
    path: 'fuel-prices',
    label: 'Fuel Prices',
    description: 'Selling price management for petrol, diesel, and HOBC.',
    Component: FuelPricesPage,
  },
  {
    path: 'purchases',
    label: 'Purchases',
    description: 'Fuel purchase recording and stock receipt.',
    Component: PurchasesPage,
  },
  {
    path: 'sales',
    label: 'Sales',
    description: 'Fuel sale recording and pump-side workflows.',
    Component: SalesPage,
  },
  {
    path: 'inventory',
    label: 'Inventory',
    description: 'Stock movement and valuation boundaries.',
    Component: InventoryPage,
  },
  {
    path: 'tanks',
    label: 'Tanks',
    description: 'Tank configuration and dip reconciliation.',
    Component: TanksPage,
  },
  {
    path: 'cash',
    label: 'Cash',
    description: 'Cash drawer balances and transfers.',
    Component: CashPage,
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
    path: 'person-ledger',
    label: 'Person Ledger',
    description: 'Person running balances and transaction history.',
    Component: PersonLedgerPage,
  },
  {
    path: 'accounting',
    label: 'Accounting',
    description: 'Financial controls and ledger boundaries.',
    Component: AccountingPage,
  },
  {
    path: 'reports',
    label: 'Reports',
    description: 'Operational and financial reporting boundaries.',
    Component: ReportsPage,
  },
  {
    path: 'business-partners',
    label: 'Business Partners',
    description: 'Suppliers, customers, and party relationships.',
    Component: BusinessPartnersPage,
  },
  {
    path: 'backup',
    label: 'Backup',
    description: 'Database backup and restore.',
    Component: BackupPage,
  },
  {
    path: 'settings',
    label: 'Settings',
    description: 'Application configuration boundaries.',
    Component: SettingsPage,
  },
] satisfies (AppRoute & { _hidden?: boolean })[]

/** @deprecated Use appRoutes — kept for any legacy imports. */
export const featureRoutes = appRoutes

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      ...appRoutes.map(({ path, Component }) => ({
        path,
        element: <Component />,
      })),
      { path: 'fuel', element: <Navigate to="/fuel-prices" replace /> },
      { path: 'persons', element: <Navigate to="/person-ledger" replace /> },
    ],
  },
]
