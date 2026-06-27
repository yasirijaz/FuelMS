import { ok, err } from '@fuelms/core'
import type { Result, AppError, NotFoundError } from '@fuelms/core'
import {
  NotFoundError as NotFound,
  ConflictError as Conflict,
  InfrastructureError,
} from '@fuelms/core'
import { env } from '@shared/lib/env'
import type {
  IOrganizationRepository,
  IWorkspaceRepository,
} from '../domain/repositories/IOrganizationRepository'
import type { Organization } from '../domain/entities/Organization'
import type { OrganizationId } from '../domain/ids/OrganizationId'
import type {
  CreateOrganizationInputDto,
  InitializeWorkspaceInputDto,
  OrganizationCommandResult,
  OrganizationDto,
  UpdateOrganizationInputDto,
  WorkspaceSnapshotDto,
} from '../domain/dtos/OrganizationDtos'
import { mapOrganizationDtoToDomain } from '../domain/mappers/organizationMappers'

function mapCommandError(e: { code: string; message: string; kind: string }): AppError {
  if (e.kind === 'not-found') return new NotFound('Organization', e.message)
  if (e.kind === 'conflict') return new Conflict(e.code, e.message)
  return new InfrastructureError(e.code, e.message)
}

async function loadInvoke() {
  if (!env.IS_TAURI) {
    return null
  }
  const { invoke } = await import('@tauri-apps/api/core')
  return invoke
}

async function invokeResult<T>(
  command: string,
  args?: Record<string, unknown>,
): Promise<Result<T, AppError>> {
  try {
    const invoke = await loadInvoke()
    if (!invoke) {
      return err(
        new InfrastructureError(
          'TAURI_UNAVAILABLE',
          'Tauri backend is not available. Run the desktop app with: pnpm tauri dev',
        ),
      )
    }

    const response = await invoke<OrganizationCommandResult<T>>(command, args)
    if (response.ok && response.value !== undefined) {
      return ok(response.value)
    }
    if (response.error) {
      return err(mapCommandError(response.error))
    }
    return err(new InfrastructureError('UNKNOWN', 'Command returned no value or error.'))
  } catch (caught) {
    return err(
      new InfrastructureError(
        'TAURI_INVOKE_FAILED',
        caught instanceof Error ? caught.message : String(caught),
        caught,
      ),
    )
  }
}

export class TauriOrganizationRepository implements IOrganizationRepository {
  async listAll(): Promise<Result<Organization[], AppError>> {
    const result = await invokeResult<OrganizationDto[]>('organization_list')
    if (!result.ok) return result
    return ok(result.value.map(mapOrganizationDtoToDomain))
  }

  async findById(id: OrganizationId): Promise<Result<Organization, NotFoundError>> {
    const result = await invokeResult<OrganizationDto>('organization_get_by_id', {
      organizationId: id.toString(),
    })
    if (!result.ok) return result as Result<Organization, NotFoundError>
    return ok(mapOrganizationDtoToDomain(result.value))
  }

  async create(input: CreateOrganizationInputDto): Promise<Result<WorkspaceSnapshotDto, AppError>> {
    return invokeResult<WorkspaceSnapshotDto>('organization_create', { input })
  }

  async update(input: UpdateOrganizationInputDto): Promise<Result<OrganizationDto, AppError>> {
    return invokeResult<OrganizationDto>('organization_update', { input })
  }

  async activate(organizationId: OrganizationId): Promise<Result<WorkspaceSnapshotDto, AppError>> {
    return invokeResult<WorkspaceSnapshotDto>('organization_activate', {
      organizationId: organizationId.toString(),
    })
  }

  async archive(
    organizationId: OrganizationId,
    version: number,
  ): Promise<Result<WorkspaceSnapshotDto, AppError>> {
    return invokeResult<WorkspaceSnapshotDto>('organization_archive', {
      organizationId: organizationId.toString(),
      version,
    })
  }
}

export class TauriWorkspaceRepository implements IWorkspaceRepository {
  async getSnapshot(): Promise<Result<WorkspaceSnapshotDto, AppError>> {
    return invokeResult<WorkspaceSnapshotDto>('workspace_get_snapshot')
  }

  async resolveActive(): Promise<Result<WorkspaceSnapshotDto, AppError>> {
    return invokeResult<WorkspaceSnapshotDto>('workspace_resolve_active')
  }

  async initialize(
    input: InitializeWorkspaceInputDto,
  ): Promise<Result<WorkspaceSnapshotDto, AppError>> {
    return invokeResult<WorkspaceSnapshotDto>('workspace_initialize', { input })
  }
}
