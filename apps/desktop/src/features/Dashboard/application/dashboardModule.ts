import { getCashPositionReportService, getProfitLossReportService } from '../../Reports/application/reportsModule'
import { productSummaryService } from '../../Inventory/application/inventoryModule'
import { listTanksService } from '../../Tanks/application/tankModule'
import { GetDashboardSnapshotService } from './services/DashboardServices'

export const getDashboardSnapshotService = new GetDashboardSnapshotService(
  getProfitLossReportService,
  getCashPositionReportService,
  productSummaryService,
  listTanksService,
)

export const dashboardQueryKeys = {
  snapshot: ['dashboard', 'snapshot'] as const,
}
