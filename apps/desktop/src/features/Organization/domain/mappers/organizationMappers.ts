import { OrganizationName } from '../valueObjects/OrganizationName'
import { OrganizationId } from '../ids/OrganizationId'
import { isOrganizationStatus } from '../valueObjects/OrganizationStatus'
import { Organization } from '../entities/Organization'
import { Workspace } from '../entities/Workspace'
import { WorkspaceId } from '../ids/WorkspaceId'
import type {
  OrganizationDto,
  WorkspaceDto,
  WorkspaceSnapshotDto,
} from '../dtos/OrganizationDtos'

export function mapOrganizationDtoToDomain(dto: OrganizationDto): Organization {
  const nameResult = OrganizationName.create(dto.name)
  if (!nameResult.ok) {
    throw new Error(`Invalid persisted organization name: ${dto.name}`)
  }
  if (!isOrganizationStatus(dto.status)) {
    throw new Error(`Invalid persisted organization status: ${dto.status}`)
  }

  return Organization.reconstitute({
    id: OrganizationId.fromPersisted(dto.id),
    name: nameResult.value,
    legalName: dto.legalName,
    address: dto.address,
    city: dto.city,
    phone: dto.phone,
    taxId: dto.taxId,
    status: dto.status,
    createdAt: new Date(dto.createdAtIso),
    updatedAt: new Date(dto.updatedAtIso),
    version: dto.version,
  })
}

export function mapOrganizationToDto(org: Organization): OrganizationDto {
  return {
    id: org.id.toString(),
    name: org.name.value,
    legalName: org.legalName,
    address: org.address,
    city: org.city,
    phone: org.phone,
    taxId: org.taxId,
    status: org.status,
    createdAtIso: org.createdAt.toISOString(),
    updatedAtIso: org.updatedAt.toISOString(),
    version: org.version,
  }
}

export function mapWorkspaceDtoToDomain(dto: WorkspaceDto): Workspace {
  return Workspace.reconstitute({
    id: WorkspaceId.fromPersisted(dto.id),
    name: dto.name,
    activeOrganizationId: dto.activeOrganizationId
      ? OrganizationId.fromPersisted(dto.activeOrganizationId)
      : null,
    updatedAt: new Date(dto.updatedAtIso),
    version: dto.version,
  })
}

export function mapWorkspaceSnapshotDtoToDomain(snapshot: WorkspaceSnapshotDto): {
  workspace: Workspace
  organizations: Organization[]
  activeOrganization: Organization | null
} {
  return {
    workspace: mapWorkspaceDtoToDomain(snapshot.workspace),
    organizations: snapshot.organizations.map(mapOrganizationDtoToDomain),
    activeOrganization: snapshot.activeOrganization
      ? mapOrganizationDtoToDomain(snapshot.activeOrganization)
      : null,
  }
}
