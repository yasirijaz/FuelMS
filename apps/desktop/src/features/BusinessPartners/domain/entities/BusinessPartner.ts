import { AggregateRoot } from '@fuelms/domain'
import type { BusinessPartnerId } from '../ids/BusinessPartnerId'
import { BusinessPartnerId as BusinessPartnerIdFactory } from '../ids/BusinessPartnerId'
import type { DisplayName } from '../valueObjects/DisplayName'
import type { PartnerRoleCode } from '../valueObjects/PartnerRoleCode'

export interface BusinessPartnerDetails {
  legalName: string | null
  phone: string | null
  email: string | null
  taxId: string | null
  address: string | null
  notes: string | null
}

function trimOrNull(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

/** Business partner — suppliers, customers, employees, and other parties. */
export class BusinessPartner extends AggregateRoot<BusinessPartnerId> {
  private _displayName: DisplayName
  private _legalName: string | null
  private _phone: string | null
  private _email: string | null
  private _taxId: string | null
  private _address: string | null
  private _notes: string | null
  private _isActive: boolean
  private _roles: PartnerRoleCode[]
  private _createdAt: Date
  private _updatedAt: Date
  private _version: number

  private constructor(
    id: BusinessPartnerId,
    props: {
      displayName: DisplayName
      legalName: string | null
      phone: string | null
      email: string | null
      taxId: string | null
      address: string | null
      notes: string | null
      isActive: boolean
      roles: PartnerRoleCode[]
      createdAt: Date
      updatedAt: Date
      version: number
    },
  ) {
    super(id)
    this._displayName = props.displayName
    this._legalName = props.legalName
    this._phone = props.phone
    this._email = props.email
    this._taxId = props.taxId
    this._address = props.address
    this._notes = props.notes
    this._isActive = props.isActive
    this._roles = [...props.roles]
    this._createdAt = props.createdAt
    this._updatedAt = props.updatedAt
    this._version = props.version
  }

  static reconstitute(props: {
    id: BusinessPartnerId
    displayName: DisplayName
    legalName: string | null
    phone: string | null
    email: string | null
    taxId: string | null
    address: string | null
    notes: string | null
    isActive: boolean
    roles: PartnerRoleCode[]
    createdAt: Date
    updatedAt: Date
    version: number
  }): BusinessPartner {
    return new BusinessPartner(props.id, props)
  }

  static createNewId(): BusinessPartnerId {
    return BusinessPartnerIdFactory.create()
  }

  get displayName(): DisplayName {
    return this._displayName
  }

  get legalName(): string | null {
    return this._legalName
  }

  get phone(): string | null {
    return this._phone
  }

  get email(): string | null {
    return this._email
  }

  get taxId(): string | null {
    return this._taxId
  }

  get address(): string | null {
    return this._address
  }

  get notes(): string | null {
    return this._notes
  }

  get isActive(): boolean {
    return this._isActive
  }

  get roles(): readonly PartnerRoleCode[] {
    return this._roles
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

  hasRole(roleCode: PartnerRoleCode): boolean {
    return this._roles.includes(roleCode)
  }

  canRemoveRole(roleCode: PartnerRoleCode): boolean {
    if (!this._roles.includes(roleCode)) return false
    if (this._isActive && this._roles.length <= 1) return false
    return true
  }

  canBeActivated(): boolean {
    return this._roles.length > 0
  }

  applyDetails(displayName: DisplayName, details: BusinessPartnerDetails): void {
    this._displayName = displayName
    this._legalName = trimOrNull(details.legalName)
    this._phone = trimOrNull(details.phone)
    this._email = trimOrNull(details.email)
    this._taxId = trimOrNull(details.taxId)
    this._address = trimOrNull(details.address)
    this._notes = trimOrNull(details.notes)
    this._updatedAt = new Date()
  }

  setActive(active: boolean): void {
    this._isActive = active
    this._updatedAt = new Date()
  }

  assignRole(roleCode: PartnerRoleCode): void {
    if (!this._roles.includes(roleCode)) {
      this._roles.push(roleCode)
      this._roles.sort()
      this._updatedAt = new Date()
    }
  }

  removeRole(roleCode: PartnerRoleCode): void {
    this._roles = this._roles.filter((role) => role !== roleCode)
    this._updatedAt = new Date()
  }

  bumpVersion(): void {
    this._version += 1
  }

  setVersion(version: number): void {
    this._version = version
  }
}
