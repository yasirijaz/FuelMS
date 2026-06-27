import { UniqueId } from '@fuelms/core'

export class OrganizationId extends UniqueId {
  static create(): OrganizationId {
    return new OrganizationId(UniqueId.generate().toString())
  }

  static fromPersisted(value: string): OrganizationId {
    return new OrganizationId(value)
  }
}
