import { getDashboardSnapshotService } from '../dashboardModule'

export async function getDashboardSnapshot() {
  const result = await getDashboardSnapshotService.execute()
  if (!result.ok) {
    throw result.error
  }
  return result.value
}
