import type { QueryClient } from '@tanstack/react-query'

const ORGANIZATION_DATA_QUERY_ROOTS = [
  'sales',
  'purchases',
  'business-partners',
  'tanks',
  'inventory',
  'cash',
  'reports',
  'dashboard',
  'fuel-prices',
  'expenses',
  'income',
  'accounting',
  'person-ledger',
  'backup',
] as const

export function invalidateOrganizationDataQueries(queryClient: QueryClient): void {
  for (const root of ORGANIZATION_DATA_QUERY_ROOTS) {
    void queryClient.invalidateQueries({ queryKey: [root] })
  }
}
