import { ok, err } from '@fuelms/core'
import type { Result } from '@fuelms/core'
import { DomainError } from '@fuelms/core'
import { AggregateRoot } from '@fuelms/domain'
import type { OrganizationId } from '../ids/OrganizationId'
import { OrganizationId as OrganizationIdFactory } from '../ids/OrganizationId'
import type { OrganizationName } from '../valueObjects/OrganizationName'
import type { OrganizationStatus } from '../valueObjects/OrganizationStatus'
import {
  OrganizationArchived,
  OrganizationCreated,
  OrganizationUpdated,
} from '../events/OrganizationEvents'

export interface OrganizationDetails {
  legalName: string | null
  address: string | null
  city: string | null
  phone: string | null
  taxId: string | null
}

export interface CreateOrganizationParams {
  name: OrganizationName
  details?: Partial<OrganizationDetails>
}

export interface UpdateOrganizationParams {
  name: OrganizationName
  details: OrganizationDetails
}

function trimOrNull(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

/**
 * Organization — aggregate root for a petrol pump business entity.
 *
 * Every future business record must reference an Organization.
 */
export class Organization extends AggregateRoot<OrganizationId> {
  private _name: OrganizationName
  private _legalName: string | null
  private _address: string | null
  private _city: string | null
  private _phone: string | null
  private _taxId: string | null
  private _status: OrganizationStatus
  private _createdAt: Date
  private _updatedAt: Date
  private _version: number

  private constructor(
    id: OrganizationId,
    props: {
      name: OrganizationName
      legalName: string | null
      address: string | null
      city: string | null
      phone: string | null
      taxId: string | null
      status: OrganizationStatus
      createdAt: Date
      updatedAt: Date
      version: number
    },
  ) {
    super(id)
    this._name = props.name
    this._legalName = props.legalName
    this._address = props.address
    this._city = props.city
    this._phone = props.phone
    this._taxId = props.taxId
    this._status = props.status
    this._createdAt = props.createdAt
    this._updatedAt = props.updatedAt
    this._version = props.version
  }

  static create(params: CreateOrganizationParams): Result<Organization, DomainError> {
    const now = new Date()
    const org = new Organization(OrganizationIdFactory.create(), {
      name: params.name,
      legalName: trimOrNull(params.details?.legalName),
      address: trimOrNull(params.details?.address),
      city: trimOrNull(params.details?.city),
      phone: trimOrNull(params.details?.phone),
      taxId: trimOrNull(params.details?.taxId),
      status: 'active',
      createdAt: now,
      updatedAt: now,
      version: 1,
    })
    org.raise(new OrganizationCreated(org.id.toString(), org._name.value))
    return ok(org)
  }

  static reconstitute(props: {
    id: OrganizationId
    name: OrganizationName
    legalName: string | null
    address: string | null
    city: string | null
    phone: string | null
    taxId: string | null
    status: OrganizationStatus
    createdAt: Date
    updatedAt: Date
    version: number
  }): Organization {
    return new Organization(props.id, props)
  }

  get name(): OrganizationName {
    return this._name
  }

  get legalName(): string | null {
    return this._legalName
  }

  get address(): string | null {
    return this._address
  }

  get city(): string | null {
    return this._city
  }

  get phone(): string | null {
    return this._phone
  }

  get taxId(): string | null {
    return this._taxId
  }

  get status(): OrganizationStatus {
    return this._status
  }

  get createdAt(): Date {
    return this._createdAt
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  get version(): number {
    return this._version
  }

  get isActive(): boolean {
    return this._status === 'active'
  }

  get isArchived(): boolean {
    return this._status === 'archived'
  }

  updateDetails(params: UpdateOrganizationParams): Result<void, DomainError> {
    if (this.isArchived) {
      return err(
        new DomainError(
          'ORGANIZATION_ARCHIVED',
          'Archived organizations cannot be updated.',
        ),
      )
    }

    this._name = params.name
    this._legalName = trimOrNull(params.details.legalName)
    this._address = trimOrNull(params.details.address)
    this._city = trimOrNull(params.details.city)
    this._phone = trimOrNull(params.details.phone)
    this._taxId = trimOrNull(params.details.taxId)
    this._updatedAt = new Date()
    this.raise(new OrganizationUpdated(this.id.toString()))
    return ok(undefined)
  }

  archive(): Result<void, DomainError> {
    if (this.isArchived) {
      return err(
        new DomainError(
          'ORGANIZATION_ALREADY_ARCHIVED',
          'Organization is already archived.',
        ),
      )
    }

    this._status = 'archived'
    this._updatedAt = new Date()
    this.raise(new OrganizationArchived(this.id.toString()))
    return ok(undefined)
  }

  canBeActivated(): boolean {
    return this.isActive
  }
}
