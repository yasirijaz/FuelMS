import { ok } from '@fuelms/core'
import type { Result } from '@fuelms/core'
import { DomainError } from '@fuelms/core'
import { AggregateRoot } from '@fuelms/domain'
import type { WorkspaceId } from '../ids/WorkspaceId'
import type { OrganizationId } from '../ids/OrganizationId'

/**
 * Workspace — installation context that tracks the active Organization.
 *
 * V1 uses a single default workspace row; the model supports multiple later.
 */
export class Workspace extends AggregateRoot<WorkspaceId> {
  private _name: string
  private _activeOrganizationId: OrganizationId | null
  private _updatedAt: Date
  private _version: number

  private constructor(
    id: WorkspaceId,
    props: {
      name: string
      activeOrganizationId: OrganizationId | null
      updatedAt: Date
      version: number
    },
  ) {
    super(id)
    this._name = props.name
    this._activeOrganizationId = props.activeOrganizationId
    this._updatedAt = props.updatedAt
    this._version = props.version
  }

  static reconstitute(props: {
    id: WorkspaceId
    name: string
    activeOrganizationId: OrganizationId | null
    updatedAt: Date
    version: number
  }): Workspace {
    return new Workspace(props.id, props)
  }

  get name(): string {
    return this._name
  }

  get activeOrganizationId(): OrganizationId | null {
    return this._activeOrganizationId
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  get version(): number {
    return this._version
  }

  setActiveOrganization(organizationId: OrganizationId): Result<void, DomainError> {
    this._activeOrganizationId = organizationId
    this._updatedAt = new Date()
    return ok(undefined)
  }

  clearActiveOrganization(): Result<void, DomainError> {
    this._activeOrganizationId = null
    this._updatedAt = new Date()
    return ok(undefined)
  }
}
