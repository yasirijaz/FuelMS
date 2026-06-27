import { ok, err } from '@fuelms/core'
import type { Result, AppError, NotFoundError } from '@fuelms/core'
import { ConflictError } from '@fuelms/core'
import { InMemoryRepository } from '@fuelms/testing'
import {
  Organization,
  OrganizationId,
  OrganizationName,
  mapOrganizationToDto,
} from '../domain'
import type {
  CreateOrganizationInputDto,
  InitializeWorkspaceInputDto,
  OrganizationDto,
  UpdateOrganizationInputDto,
  WorkspaceSnapshotDto,
} from '../domain/dtos/OrganizationDtos'
import type {
  IOrganizationRepository,
  IWorkspaceRepository,
} from '../domain/repositories/IOrganizationRepository'
import { DEFAULT_WORKSPACE_ID } from '../domain/ids/WorkspaceId'

export class InMemoryOrganizationRepository
  extends InMemoryRepository<Organization, OrganizationId>
  implements IOrganizationRepository
{
  protected readonly entityType = 'Organization'

  activeOrganizationId: string | null = null
  workspaceVersion = 1
  workspaceName = 'Default Workspace'

  buildSnapshot(): WorkspaceSnapshotDto {
    const organizations = this.all().map(mapOrganizationToDto)
    const activeOrganization =
      organizations.find((org) => org.id === this.activeOrganizationId) ?? null

    return {
      workspace: {
        id: DEFAULT_WORKSPACE_ID,
        name: this.workspaceName,
        activeOrganizationId: this.activeOrganizationId,
        updatedAtIso: new Date().toISOString(),
        version: this.workspaceVersion,
      },
      organizations,
      activeOrganization,
    }
  }

  async listAll(): Promise<Result<Organization[], AppError>> {
    return ok(this.all())
  }

  async create(input: CreateOrganizationInputDto): Promise<Result<WorkspaceSnapshotDto, AppError>> {
    const nameResult = OrganizationName.create(input.name)
    if (!nameResult.ok) return nameResult

    const duplicate = this.all().some(
      (org) => org.isActive && org.name.normalized() === nameResult.value.normalized(),
    )
    if (duplicate) {
      return err(new ConflictError('ORGANIZATION_NAME_DUPLICATE', 'Duplicate name.'))
    }

    const orgResult = Organization.create({
      name: nameResult.value,
      details: input,
    })
    if (!orgResult.ok) return orgResult

    await this.save(orgResult.value)

    if (this.activeOrganizationId === null) {
      this.activeOrganizationId = orgResult.value.id.toString()
    }

    return ok(this.buildSnapshot())
  }

  async update(input: UpdateOrganizationInputDto): Promise<Result<OrganizationDto, AppError>> {
    const existing = await this.findById(OrganizationId.fromPersisted(input.id))
    if (!existing.ok) return existing

    const nameResult = OrganizationName.create(input.name)
    if (!nameResult.ok) return nameResult

    const duplicate = this.all().some(
      (org) =>
        org.isActive &&
        org.id.toString() !== input.id &&
        org.name.normalized() === nameResult.value.normalized(),
    )
    if (duplicate) {
      return err(new ConflictError('ORGANIZATION_NAME_DUPLICATE', 'Duplicate name.'))
    }

    const updateResult = existing.value.updateDetails({
      name: nameResult.value,
      details: {
        legalName: input.legalName ?? null,
        address: input.address ?? null,
        city: input.city ?? null,
        phone: input.phone ?? null,
        taxId: input.taxId ?? null,
      },
    })
    if (!updateResult.ok) return updateResult

    await this.save(existing.value)
    return ok(mapOrganizationToDto(existing.value))
  }

  async activate(organizationId: OrganizationId): Promise<Result<WorkspaceSnapshotDto, AppError>> {
    const org = await this.findById(organizationId)
    if (!org.ok) return org as Result<WorkspaceSnapshotDto, NotFoundError>
    if (!org.value.canBeActivated()) {
      return err(new ConflictError('ORGANIZATION_ARCHIVED', 'Archived organizations cannot be activated.'))
    }

    this.activeOrganizationId = organizationId.toString()
    this.workspaceVersion += 1
    return ok(this.buildSnapshot())
  }

  async archive(
    organizationId: OrganizationId,
    _version: number,
  ): Promise<Result<WorkspaceSnapshotDto, AppError>> {
    const org = await this.findById(organizationId)
    if (!org.ok) return org as Result<WorkspaceSnapshotDto, NotFoundError>

    const archiveResult = org.value.archive()
    if (!archiveResult.ok) return archiveResult

    await this.save(org.value)

    if (this.activeOrganizationId === organizationId.toString()) {
      const next = this.all().find((item) => item.isActive)
      this.activeOrganizationId = next?.id.toString() ?? null
      this.workspaceVersion += 1
    }

    return ok(this.buildSnapshot())
  }
}

export class InMemoryWorkspaceRepository implements IWorkspaceRepository {
  constructor(private readonly organizationRepository: InMemoryOrganizationRepository) {}

  async getSnapshot(): Promise<Result<WorkspaceSnapshotDto, AppError>> {
    return ok(this.organizationRepository.buildSnapshot())
  }

  async resolveActive(): Promise<Result<WorkspaceSnapshotDto, AppError>> {
    const snapshot = this.organizationRepository.buildSnapshot()
    const activeOrgs = snapshot.organizations.filter((org) => org.status === 'active')

    if (!snapshot.workspace.activeOrganizationId && activeOrgs.length === 1) {
      this.organizationRepository.activeOrganizationId = activeOrgs[0]?.id ?? null
      this.organizationRepository.workspaceVersion += 1
      return ok(this.organizationRepository.buildSnapshot())
    }

    return ok(snapshot)
  }

  async initialize(
    input: InitializeWorkspaceInputDto,
  ): Promise<Result<WorkspaceSnapshotDto, AppError>> {
    const activeOrgs = this.organizationRepository.all().filter((org) => org.isActive)
    if (activeOrgs.length > 0) {
      return err(
        new ConflictError(
          'WORKSPACE_ALREADY_INITIALIZED',
          'This workspace already has an active organization.',
        ),
      )
    }

    this.organizationRepository.workspaceName = input.workspaceName.trim()
    this.organizationRepository.workspaceVersion += 1

    return this.organizationRepository.create({
      name: input.name,
      legalName: input.legalName,
      address: input.address,
      city: input.city,
      phone: input.phone,
      taxId: input.taxId,
    })
  }
}
