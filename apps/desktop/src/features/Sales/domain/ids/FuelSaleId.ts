import { UniqueId } from '@fuelms/core'

export class FuelSaleId extends UniqueId {
  static create(): FuelSaleId {
    return new FuelSaleId(`fs-${UniqueId.generate().toString()}`)
  }

  static fromPersisted(value: string): FuelSaleId {
    return new FuelSaleId(value)
  }
}
