import { InMemoryReportsRepository } from '../../infrastructure/InMemoryReportsRepository'
import {
  GetCashPositionReportService,
  GetFuelProductLedgerReportService,
  GetFuelSalesSummaryReportService,
  GetProfitLossReportService,
} from './ReportsServices'

describe('ReportsServices', () => {
  it('rejects profit loss query when from date is after to date', async () => {
    const repository = new InMemoryReportsRepository()
    const service = new GetProfitLossReportService(repository)
    const result = await service.execute({
      fromDateIso: '2026-06-30',
      toDateIso: '2026-06-01',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.message).toContain('From date must be on or before to date.')
    }
  })

  it('returns fuel sales summary grouped by product', async () => {
    const repository = new InMemoryReportsRepository()
    const service = new GetFuelSalesSummaryReportService(repository)
    const result = await service.execute({
      fromDateIso: '2026-06-01',
      toDateIso: '2026-06-30',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.lines).toHaveLength(1)
    expect(result.value.lines[0]?.productCode).toBe('diesel')
    expect(result.value.totalRevenueMinor).toBe(28_000_000)
  })

  it('returns cash position with active accounts', async () => {
    const repository = new InMemoryReportsRepository()
    const service = new GetCashPositionReportService(repository)
    const result = await service.execute()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.lines.length).toBeGreaterThanOrEqual(3)
    expect(result.value.totalBalanceMinor).toBeGreaterThan(0)
  })

  it('returns fuel product ledger with purchases, sales, and fifo profit', async () => {
    const repository = new InMemoryReportsRepository()
    const service = new GetFuelProductLedgerReportService(repository)
    const result = await service.execute({
      fromDateIso: '2026-06-01',
      toDateIso: '2026-06-30',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.value.allTimeGrossProfitMinor).toBe(8_000_000)
    const diesel = result.value.products.find((product) => product.productCode === 'diesel')
    expect(diesel?.lines).toHaveLength(2)
    expect(diesel?.allTimeGrossProfitMinor).toBe(8_000_000)
  })
})
