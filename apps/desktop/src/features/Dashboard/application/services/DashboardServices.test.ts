import { rupeesToMinor } from '@fuelms/shared'
import { InMemoryInventoryRepository } from '../../../Inventory/infrastructure/InMemoryInventoryRepository'
import { ProductSummaryService } from '../../../Inventory/application/services/InventoryServices'
import { InMemoryReportsRepository } from '../../../Reports/infrastructure/InMemoryReportsRepository'
import {
  GetCashPositionReportService,
  GetProfitLossReportService,
} from '../../../Reports/application/services/ReportsServices'
import { InMemoryTankRepository } from '../../../Tanks/infrastructure/InMemoryTankRepository'
import { ListTanksService } from '../../../Tanks/application/services/TankServices'
import { GetDashboardSnapshotService } from './DashboardServices'

function buildService(clock: () => Date) {
  const reportsRepository = new InMemoryReportsRepository()
  const inventoryRepository = new InMemoryInventoryRepository()
  const tankRepository = new InMemoryTankRepository()

  return new GetDashboardSnapshotService(
    new GetProfitLossReportService(reportsRepository),
    new GetCashPositionReportService(reportsRepository),
    new ProductSummaryService(inventoryRepository),
    new ListTanksService(tankRepository),
    clock,
  )
}

describe('GetDashboardSnapshotService', () => {
  it('aggregates today KPIs, tank levels, and inventory from module read models', async () => {
    const service = buildService(() => new Date('2026-06-20T12:00:00.000Z'))
    const result = await service.execute()

    expect(result.ok).toBe(true)
    if (!result.ok) return

    const salesKpi = result.value.kpis.find((kpi) => kpi.id === 'todaySales')
    const profitKpi = result.value.kpis.find((kpi) => kpi.id === 'todayProfit')
    const cashKpi = result.value.kpis.find((kpi) => kpi.id === 'cashBalance')

    expect(salesKpi?.amountMinor).toBe(28_000_000)
    expect(profitKpi?.amountMinor).toBe(8_000_000)
    expect(cashKpi?.amountMinor).toBe(rupeesToMinor(700_000))

    expect(result.value.fuelStock).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ productCode: 'diesel', fillPercent: 25 }),
        expect.objectContaining({ productCode: 'petrol', fillPercent: 21 }),
        expect.objectContaining({ productCode: 'hobc', fillPercent: 0 }),
      ]),
    )

    expect(result.value.inventoryProducts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ productCode: 'diesel', quantityLitres: 7500 }),
        expect.objectContaining({ productCode: 'petrol', quantityLitres: 4200 }),
      ]),
    )
    expect(result.value.quickActions.length).toBeGreaterThan(0)
  })

  it('returns zero today KPIs when no activity on the current date', async () => {
    const service = buildService(() => new Date('2026-06-01T12:00:00.000Z'))
    const result = await service.execute()

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.value.kpis.find((kpi) => kpi.id === 'todaySales')?.amountMinor).toBe(0)
    expect(result.value.kpis.find((kpi) => kpi.id === 'todayProfit')?.amountMinor).toBe(0)
  })
})
