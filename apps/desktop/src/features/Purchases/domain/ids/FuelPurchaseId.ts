import { UniqueId } from '@fuelms/core'

export class FuelPurchaseId extends UniqueId {
  static create(): FuelPurchaseId {
    return new FuelPurchaseId(`fp-${UniqueId.generate().toString()}`)
  }

  static fromPersisted(value: string): FuelPurchaseId {
    return new FuelPurchaseId(value)
  }
}
