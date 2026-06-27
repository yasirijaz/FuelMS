import { describe, it, expect, beforeEach } from 'vitest'
import { unwrap } from '@fuelms/core'
import {
  InMemoryFuelProductRepository,
  InMemoryFuelPriceRecordRepository,
} from '../../infrastructure/priceManagement/InMemoryFuelPriceRepositories'
import {
  RecordFuelPriceService,
  CancelScheduledFuelPriceService,
  ListFuelPriceOverviewService,
} from './FuelPriceServices'

describe('FuelPriceServices', () => {
  const products = new InMemoryFuelProductRepository()
  let prices: InMemoryFuelPriceRecordRepository
  let recordService: RecordFuelPriceService
  let cancelService: CancelScheduledFuelPriceService
  let overviewService: ListFuelPriceOverviewService

  beforeEach(() => {
    prices = new InMemoryFuelPriceRecordRepository()
    recordService = new RecordFuelPriceService(products, prices)
    cancelService = new CancelScheduledFuelPriceService(prices)
    overviewService = new ListFuelPriceOverviewService(products, prices)
  })

  it('records an active price and supersedes the previous active price', async () => {
    const first = unwrap(
      await recordService.execute({
        productCode: 'diesel',
        priceRupees: 280,
        effectiveFromIso: '2026-01-01T00:00:00.000Z',
      }),
    )
    expect(first.status).toBe('active')

    const second = unwrap(
      await recordService.execute({
        productCode: 'diesel',
        priceRupees: 295,
        effectiveFromIso: '2026-06-01T00:00:00.000Z',
      }),
    )
    expect(second.status).toBe('active')

    const overview = unwrap(await overviewService.execute())
    const diesel = overview.activePrices.find((p) => p.productCode === 'diesel')
    expect(diesel?.priceMinorPerLitre).toBe(29500)
  })

  it('schedules a future price', async () => {
    const scheduled = unwrap(
      await recordService.execute({
        productCode: 'petrol',
        priceRupees: 310,
        effectiveFromIso: '2026-12-31T23:59:00.000Z',
      }),
    )
    expect(scheduled.status).toBe('scheduled')

    const overview = unwrap(await overviewService.execute())
    expect(overview.scheduledPrices).toHaveLength(1)
    expect(overview.scheduledPrices[0]?.productCode).toBe('petrol')
  })

  it('cancels a scheduled price', async () => {
    const scheduled = unwrap(
      await recordService.execute({
        productCode: 'hobc',
        priceRupees: 350,
        effectiveFromIso: '2026-12-31T00:00:00.000Z',
      }),
    )

    unwrap(await cancelService.execute(scheduled.id.toString()))

    const overview = unwrap(await overviewService.execute())
    expect(overview.scheduledPrices).toHaveLength(0)
  })
})
