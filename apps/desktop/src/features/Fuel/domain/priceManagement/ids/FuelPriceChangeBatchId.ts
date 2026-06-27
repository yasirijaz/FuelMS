import { UniqueId } from '@fuelms/core'

export class FuelPriceChangeBatchId extends UniqueId {
  static create(): FuelPriceChangeBatchId {
    return new FuelPriceChangeBatchId(UniqueId.generate().toString())
  }

  static fromPersisted(value: string): FuelPriceChangeBatchId {
    return new FuelPriceChangeBatchId(value)
  }
}
