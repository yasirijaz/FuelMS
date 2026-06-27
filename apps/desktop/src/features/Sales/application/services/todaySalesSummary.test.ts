import { FuelSale } from '../../domain/entities/FuelSale'
import { FuelSaleId } from '../../domain/ids/FuelSaleId'
import { buildTodaySalesSummary } from './todaySalesSummary'

function sale(
  status: 'draft' | 'posted',
  saleDateIso: string,
  quantityMilliLitres: number,
  revenueMinor: number,
): FuelSale {
  const saleDate = new Date(saleDateIso)
  return FuelSale.reconstitute({
    id: FuelSaleId.fromPersisted(`sale-${status}-${revenueMinor}`),
    saleDate,
    productId: 'product-diesel',
    productCode: 'diesel',
    customerPartnerId: null,
    customerName: null,
    quantityMilliLitres,
    unitPriceMinorPerLitre: 280_00,
    fuelPriceRecordId: 'price-1',
    totalRevenueMinor: revenueMinor,
    totalCogsMinor: status === 'posted' ? 200_00 * (quantityMilliLitres / 1000) : 0,
    paymentMethod: 'cash',
    reference: null,
    notes: null,
    status,
    recordedBy: 'owner',
    createdAt: saleDate,
    updatedAt: saleDate,
    version: 1,
  })
}

describe('buildTodaySalesSummary', () => {
  it('aggregates posted and draft sales for the given local date', () => {
    const summary = buildTodaySalesSummary(
      [
        sale('posted', '2026-06-20T10:00:00.000Z', 5_000_000, 1_400_000_00),
        sale('posted', '2026-06-20T15:00:00.000Z', 2_000_000, 560_000_00),
        sale('draft', '2026-06-20T18:00:00.000Z', 1_000_000, 280_000_00),
        sale('posted', '2026-06-19T10:00:00.000Z', 3_000_000, 840_000_00),
      ],
      '2026-06-20',
    )

    expect(summary.posted).toEqual({
      saleCount: 2,
      quantityLitres: 7000,
      revenueMinor: 1_960_000_00,
    })
    expect(summary.draft).toEqual({
      saleCount: 1,
      quantityLitres: 1000,
      revenueMinor: 280_000_00,
    })
  })

  it('returns zero buckets when no sales match the date', () => {
    const summary = buildTodaySalesSummary([], '2026-06-01')
    expect(summary.posted.saleCount).toBe(0)
    expect(summary.draft.saleCount).toBe(0)
  })
})
