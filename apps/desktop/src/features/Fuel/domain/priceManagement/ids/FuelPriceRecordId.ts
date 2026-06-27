import { UniqueId } from '@fuelms/core'

export class FuelPriceRecordId extends UniqueId {
  static create(): FuelPriceRecordId {
    return new FuelPriceRecordId(UniqueId.generate().toString())
  }

  static fromPersisted(value: string): FuelPriceRecordId {
    return new FuelPriceRecordId(value)
  }
}
