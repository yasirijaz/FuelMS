import { DomainEvent } from '@fuelms/domain'

export class OrganizationCreated extends DomainEvent {
  readonly eventType = 'organization.created' as const
  readonly name: string

  constructor(aggregateId: string, name: string, correlationId?: string) {
    super(aggregateId, 'Organization', correlationId)
    this.name = name
  }
}

export class OrganizationUpdated extends DomainEvent {
  readonly eventType = 'organization.updated' as const

  constructor(aggregateId: string, correlationId?: string) {
    super(aggregateId, 'Organization', correlationId)
  }
}

export class OrganizationActivated extends DomainEvent {
  readonly eventType = 'organization.activated' as const

  constructor(aggregateId: string, correlationId?: string) {
    super(aggregateId, 'Organization', correlationId)
  }
}

export class OrganizationArchived extends DomainEvent {
  readonly eventType = 'organization.archived' as const

  constructor(aggregateId: string, correlationId?: string) {
    super(aggregateId, 'Organization', correlationId)
  }
}
