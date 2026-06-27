import { UniqueId } from '@fuelms/core'

export class BusinessPartnerId extends UniqueId {
  static create(): BusinessPartnerId {
    return new BusinessPartnerId(UniqueId.generate().toString())
  }

  static fromPersisted(value: string): BusinessPartnerId {
    return new BusinessPartnerId(value)
  }
}
