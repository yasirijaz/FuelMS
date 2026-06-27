import type { FuelProduct } from '../../domain/priceManagement/entities/FuelProduct'
import type { FuelPriceRecord } from '../../domain/priceManagement/entities/FuelPriceRecord'
import type {
  ActiveFuelPriceView,
  ScheduledFuelPriceView,
  PriceHistoryEntry,
} from '../types/FuelPriceViews'
import { FUEL_PRODUCT_CODES } from '@fuelms/shared'

export function mapRecordToHistoryEntry(record: FuelPriceRecord): PriceHistoryEntry {
  return {
    id: record.id.toString(),
    productCode: record.productCode,
    priceMinorPerLitre: record.pricePerLitre.minorPerLitre,
    effectiveFromIso: record.effectiveFrom.iso,
    status: record.status,
  }
}

export function mapRecordToScheduledView(
  record: FuelPriceRecord,
  productName: string,
): ScheduledFuelPriceView {
  return {
    recordId: record.id.toString(),
    productCode: record.productCode,
    productName,
    priceMinorPerLitre: record.pricePerLitre.minorPerLitre,
    effectiveFromIso: record.effectiveFrom.iso,
    reason: record.reason,
  }
}

export function buildActivePriceViews(
  products: FuelProduct[],
  activeRecords: FuelPriceRecord[],
): ActiveFuelPriceView[] {
  const activeByCode = new Map(activeRecords.map((record) => [record.productCode, record]))

  return FUEL_PRODUCT_CODES.map((code) => {
    const product = products.find((p) => p.code === code)
    const record = activeByCode.get(code)
    return {
      productCode: code,
      productName: product?.name ?? code,
      priceMinorPerLitre: record?.pricePerLitre.minorPerLitre ?? null,
      effectiveFromIso: record?.effectiveFrom.iso ?? null,
      recordId: record?.id.toString() ?? null,
    }
  })
}
