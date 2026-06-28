import { FuelSale } from '../../domain/entities/FuelSale'
import { FuelSaleId } from '../../domain/ids/FuelSaleId'
import type { SalePaymentMethod } from '../../domain/valueObjects/SalePaymentMethod'
import { buildSalesPeriodSummary } from './salesPeriodSummary'

function sale(
  status: 'draft' | 'posted',
  saleDateIso: string,
  paymentMethod: SalePaymentMethod,
  revenueMinor: number,
): FuelSale {
  const saleDate = new Date(saleDateIso)
  return FuelSale.reconstitute({
    id: FuelSaleId.fromPersisted(`sale-${status}-${paymentMethod}-${revenueMinor}`),
    saleDate,
    productId: 'product-diesel',
    productCode: 'diesel',
    customerPartnerId: paymentMethod === 'credit' ? 'customer-1' : null,
    customerName: paymentMethod === 'credit' ? 'ABC Transport' : null,
    quantityMilliLitres: 1_000_000,
    unitPriceMinorPerLitre: 280_00,
    fuelPriceRecordId: 'price-1',
    totalRevenueMinor: revenueMinor,
    totalCogsMinor: status === 'posted' ? 200_000_00 : 0,
    paymentMethod,
    reference: null,
    notes: null,
    status,
    recordedBy: 'owner',
    createdAt: saleDate,
    updatedAt: saleDate,
    version: 1,
  })
}

describe('buildSalesPeriodSummary', () => {
  it('sums posted cash and card as net cash, excluding credit', () => {
    const summary = buildSalesPeriodSummary(
      [
        sale('posted', '2026-06-10T10:00:00.000Z', 'cash', 100_000_00),
        sale('posted', '2026-06-15T10:00:00.000Z', 'card', 50_000_00),
        sale('posted', '2026-06-20T10:00:00.000Z', 'credit', 200_000_00),
        sale('posted', '2026-06-25T10:00:00.000Z', 'cash', 30_000_00),
        sale('posted', '2026-07-01T10:00:00.000Z', 'cash', 999_000_00),
      ],
      '2026-06-01',
      '2026-06-30',
    )

    expect(summary.posted.saleCount).toBe(4)
    expect(summary.posted.cashMinor).toBe(130_000_00)
    expect(summary.posted.cardMinor).toBe(50_000_00)
    expect(summary.posted.creditMinor).toBe(200_000_00)
    expect(summary.posted.netCashMinor).toBe(180_000_00)
    expect(summary.posted.totalRevenueMinor).toBe(380_000_00)
  })

  it('tracks draft net cash separately from posted', () => {
    const summary = buildSalesPeriodSummary(
      [
        sale('draft', '2026-06-12T10:00:00.000Z', 'cash', 40_000_00),
        sale('posted', '2026-06-12T11:00:00.000Z', 'cash', 60_000_00),
      ],
      '2026-06-01',
      '2026-06-30',
    )

    expect(summary.posted.netCashMinor).toBe(60_000_00)
    expect(summary.draft.netCashMinor).toBe(40_000_00)
  })
})
