import type { Result, AppError } from '@fuelms/core'
import type { InventoryProductSummary } from '@fuelms/shared'
import type { GetCashPositionReportService } from '../../../Reports/application/services/ReportsServices'
import type { GetProfitLossReportService } from '../../../Reports/application/services/ReportsServices'
import type { ProductSummaryService } from '../../../Inventory/application/services/InventoryServices'
import type { ListTanksService } from '../../../Tanks/application/services/TankServices'
import { mapSummaryToUi } from '../../../Inventory/application/mappers/inventoryViewMappers'
import { aggregateTankLevelsByProduct } from '../utils/aggregateTankLevels'
import { getLocalDateIso } from '../utils/localDateIso'
import type { DashboardSnapshot } from '../types/DashboardSnapshot'

const QUICK_ACTIONS: DashboardSnapshot['quickActions'] = [
  { id: 'fuel-purchase', label: 'Fuel Purchase', to: '/purchases' },
  { id: 'record-sale', label: 'Record Sale', to: '/sales' },
  { id: 'expense', label: 'Expense', to: '/expenses' },
  { id: 'income', label: 'Income', to: '/income' },
  { id: 'cash-transfer', label: 'Cash Transfer', to: '/cash' },
]

export class GetDashboardSnapshotService {
  constructor(
    private readonly profitLossReport: GetProfitLossReportService,
    private readonly cashPositionReport: GetCashPositionReportService,
    private readonly productSummary: ProductSummaryService,
    private readonly listTanks: ListTanksService,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async execute(): Promise<Result<DashboardSnapshot, AppError>> {
    const todayIso = getLocalDateIso(this.clock())
    const dateRange = { fromDateIso: todayIso, toDateIso: todayIso }

    const profitLossResult = await this.profitLossReport.execute(dateRange)
    if (!profitLossResult.ok) return profitLossResult

    const cashResult = await this.cashPositionReport.execute()
    if (!cashResult.ok) return cashResult

    const inventoryResult = await this.productSummary.execute()
    if (!inventoryResult.ok) return inventoryResult

    const tanksResult = await this.listTanks.execute(true)
    if (!tanksResult.ok) return tanksResult

    const inventoryProducts: InventoryProductSummary[] = inventoryResult.value.map(mapSummaryToUi)

    return {
      ok: true,
      value: {
        kpis: [
          {
            id: 'todaySales',
            label: "Today's Sales",
            amountMinor: profitLossResult.value.fuelSalesRevenueMinor,
          },
          {
            id: 'todayProfit',
            label: "Today's Profit",
            amountMinor: profitLossResult.value.netOperatingProfitMinor,
          },
          {
            id: 'cashBalance',
            label: 'Cash Balance',
            amountMinor: cashResult.value.totalBalanceMinor,
          },
        ],
        fuelStock: aggregateTankLevelsByProduct(tanksResult.value),
        inventoryProducts,
        quickActions: QUICK_ACTIONS,
      },
    }
  }
}
