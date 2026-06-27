import type { FuelProductCode } from '@fuelms/shared'
import type { PriceHistoryEntry } from '@fuelms/shared'

/** Current selling price for one fuel product — dashboard and price board. */
export type ActiveFuelPriceView = {
  productCode: FuelProductCode
  productName: string
  priceMinorPerLitre: number | null
  effectiveFromIso: string | null
  recordId: string | null
}

/** Scheduled price awaiting activation. */
export type ScheduledFuelPriceView = {
  recordId: string
  productCode: FuelProductCode
  productName: string
  priceMinorPerLitre: number
  effectiveFromIso: string
  reason: string | null
}

export type FuelPriceOverview = {
  activePrices: ActiveFuelPriceView[]
  scheduledPrices: ScheduledFuelPriceView[]
}

export type { PriceHistoryEntry }
