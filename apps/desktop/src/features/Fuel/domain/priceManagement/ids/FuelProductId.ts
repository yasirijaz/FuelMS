import { UniqueId } from '@fuelms/core'
import type { FuelProductCode } from '../valueObjects/FuelProductCode'

/** Stable seed IDs from migration 002 — map business code to persisted product row. */
const SEED_IDS: Record<FuelProductCode, string> = {
  petrol: 'fuel-product-petrol',
  diesel: 'fuel-product-diesel',
  hobc: 'fuel-product-hobc',
}

export class FuelProductId extends UniqueId {
  static fromCode(code: FuelProductCode): FuelProductId {
    return new FuelProductId(SEED_IDS[code])
  }

  static fromPersisted(value: string): FuelProductId {
    return new FuelProductId(value)
  }
}
