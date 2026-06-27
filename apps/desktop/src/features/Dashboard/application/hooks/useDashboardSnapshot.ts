import { useQuery } from '@tanstack/react-query'
import { dashboardQueryKeys } from '../dashboardModule'
import { getDashboardSnapshot } from '../services/getDashboardSnapshot'

export function useDashboardSnapshot() {
  return useQuery({
    queryKey: dashboardQueryKeys.snapshot,
    queryFn: getDashboardSnapshot,
    staleTime: 60_000,
  })
}
