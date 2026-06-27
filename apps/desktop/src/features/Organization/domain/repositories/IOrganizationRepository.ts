import type { Result, AppError, NotFoundError } from '@fuelms/core'
import type { Organization } from '../entities/Organization'
import type { OrganizationId } from '../ids/OrganizationId'
import type {
  CreateOrganizationInputDto,
  InitializeWorkspaceInputDto,
  OrganizationDto,
  UpdateOrganizationInputDto,
  WorkspaceSnapshotDto,
} from '../dtos/OrganizationDtos'

export interface IOrganizationRepository {
  listAll(): Promise<Result<Organization[], AppError>>
  findById(id: OrganizationId): Promise<Result<Organization, NotFoundError>>
  create(input: CreateOrganizationInputDto): Promise<Result<WorkspaceSnapshotDto, AppError>>
  update(input: UpdateOrganizationInputDto): Promise<Result<OrganizationDto, AppError>>
  activate(organizationId: OrganizationId): Promise<Result<WorkspaceSnapshotDto, AppError>>
  archive(organizationId: OrganizationId, version: number): Promise<Result<WorkspaceSnapshotDto, AppError>>
}

export interface IWorkspaceRepository {
  getSnapshot(): Promise<Result<WorkspaceSnapshotDto, AppError>>
  resolveActive(): Promise<Result<WorkspaceSnapshotDto, AppError>>
  initialize(input: InitializeWorkspaceInputDto): Promise<Result<WorkspaceSnapshotDto, AppError>>
}
