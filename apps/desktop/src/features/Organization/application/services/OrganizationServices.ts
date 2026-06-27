import { ok, err } from '@fuelms/core'
import type { Result, AppError } from '@fuelms/core'
import { ValidationError } from '@fuelms/core'
import {
  Organization,
  OrganizationName,
  OrganizationId,
  type CreateOrganizationInput,
  type UpdateOrganizationInput,
  type InitializeWorkspaceInput,
  createOrganizationInputSchema,
  updateOrganizationInputSchema,
  activateOrganizationInputSchema,
  archiveOrganizationInputSchema,
  initializeWorkspaceInputSchema,
  mapOrganizationDtoToDomain,
  mapWorkspaceSnapshotDtoToDomain,
} from '../../domain'
import type {
  IOrganizationRepository,
  IWorkspaceRepository,
} from '../../domain/repositories/IOrganizationRepository'
import type { Organization as OrganizationEntity } from '../../domain/entities/Organization'
import type { WorkspaceSnapshotDto } from '../../domain/dtos/OrganizationDtos'

export class CreateOrganizationService {
  constructor(private readonly organizationRepository: IOrganizationRepository) {}

  async execute(input: CreateOrganizationInput): Promise<Result<WorkspaceSnapshotDto, AppError>> {
    const parsed = createOrganizationInputSchema.safeParse(input)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return err(new ValidationError(first?.message ?? 'Invalid organization input.'))
    }

    const nameResult = OrganizationName.create(parsed.data.name)
    if (!nameResult.ok) return nameResult

    const domainResult = Organization.create({
      name: nameResult.value,
      details: {
        legalName: parsed.data.legalName,
        address: parsed.data.address,
        city: parsed.data.city,
        phone: parsed.data.phone,
        taxId: parsed.data.taxId,
      },
    })
    if (!domainResult.ok) return domainResult

    return this.organizationRepository.create({
      name: parsed.data.name,
      legalName: parsed.data.legalName,
      address: parsed.data.address,
      city: parsed.data.city,
      phone: parsed.data.phone,
      taxId: parsed.data.taxId,
    })
  }
}

export class UpdateOrganizationService {
  constructor(private readonly organizationRepository: IOrganizationRepository) {}

  async execute(input: UpdateOrganizationInput): Promise<Result<OrganizationEntity, AppError>> {
    const parsed = updateOrganizationInputSchema.safeParse(input)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return err(new ValidationError(first?.message ?? 'Invalid organization input.'))
    }

    const nameResult = OrganizationName.create(parsed.data.name)
    if (!nameResult.ok) return nameResult

    const existing = await this.organizationRepository.findById(
      OrganizationId.fromPersisted(parsed.data.id),
    )
    if (!existing.ok) return existing

    const updateResult = existing.value.updateDetails({
      name: nameResult.value,
      details: {
        legalName: parsed.data.legalName ?? null,
        address: parsed.data.address ?? null,
        city: parsed.data.city ?? null,
        phone: parsed.data.phone ?? null,
        taxId: parsed.data.taxId ?? null,
      },
    })
    if (!updateResult.ok) return updateResult

    const saved = await this.organizationRepository.update({
      id: parsed.data.id,
      name: parsed.data.name,
      legalName: parsed.data.legalName,
      address: parsed.data.address,
      city: parsed.data.city,
      phone: parsed.data.phone,
      taxId: parsed.data.taxId,
      version: parsed.data.version,
    })
    if (!saved.ok) return saved

    return ok(mapOrganizationDtoToDomain(saved.value))
  }
}

export class ActivateOrganizationService {
  constructor(private readonly organizationRepository: IOrganizationRepository) {}

  async execute(organizationId: string): Promise<Result<WorkspaceSnapshotDto, AppError>> {
    const parsed = activateOrganizationInputSchema.safeParse({ organizationId })
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return err(new ValidationError(first?.message ?? 'Invalid activation input.'))
    }

    const id = OrganizationId.fromPersisted(parsed.data.organizationId)
    const existing = await this.organizationRepository.findById(id)
    if (!existing.ok) return existing

    if (!existing.value.canBeActivated()) {
      return err(new ValidationError('Archived organizations cannot be activated.'))
    }

    return this.organizationRepository.activate(id)
  }
}

export class ArchiveOrganizationService {
  constructor(private readonly organizationRepository: IOrganizationRepository) {}

  async execute(organizationId: string, version: number): Promise<Result<WorkspaceSnapshotDto, AppError>> {
    const parsed = archiveOrganizationInputSchema.safeParse({ organizationId, version })
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return err(new ValidationError(first?.message ?? 'Invalid archive input.'))
    }

    const id = OrganizationId.fromPersisted(parsed.data.organizationId)
    const existing = await this.organizationRepository.findById(id)
    if (!existing.ok) return existing

    if (existing.value.isArchived) {
      return err(new ValidationError('Organization is already archived.'))
    }

    return this.organizationRepository.archive(id, parsed.data.version)
  }
}

export class ResolveWorkspaceService {
  constructor(private readonly workspaceRepository: IWorkspaceRepository) {}

  async execute() {
    const snapshot = await this.workspaceRepository.resolveActive()
    if (!snapshot.ok) return snapshot
    return ok(mapWorkspaceSnapshotDtoToDomain(snapshot.value))
  }
}

export class InitializeWorkspaceService {
  constructor(private readonly workspaceRepository: IWorkspaceRepository) {}

  async execute(input: InitializeWorkspaceInput): Promise<Result<WorkspaceSnapshotDto, AppError>> {
    const parsed = initializeWorkspaceInputSchema.safeParse(input)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return err(new ValidationError(first?.message ?? 'Invalid workspace setup input.'))
    }

    return this.workspaceRepository.initialize({
      workspaceName: parsed.data.workspaceName?.trim() || parsed.data.name,
      name: parsed.data.name,
      legalName: parsed.data.legalName,
      address: parsed.data.address,
      city: parsed.data.city,
      phone: parsed.data.phone,
      taxId: parsed.data.taxId,
    })
  }
}
