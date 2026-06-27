import type { FuelProductCode } from '../valueObjects/FuelProductCode'
import type { FuelProductId } from '../ids/FuelProductId'

/** Read model for a fuel product row (reference data). */
export interface FuelProduct {
  readonly id: FuelProductId
  readonly code: FuelProductCode
  readonly name: string
  readonly unit: string
  readonly displayOrder: number
}
