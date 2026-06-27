import { ok, err } from '@fuelms/core'
import type { Result, AppError, NotFoundError } from '@fuelms/core'
import {
  NotFoundError as NotFound,
  ConflictError as Conflict,
  InfrastructureError,
} from '@fuelms/core'
import { env } from '@shared/lib/env'
import type { IBusinessPartnerRepository } from '../domain/repositories/IBusinessPartnerRepository'
import type { BusinessPartner } from '../domain/entities/BusinessPartner'
import type { BusinessPartnerId } from '../domain/ids/BusinessPartnerId'
import type {
  AssignPartnerRoleInputDto,
  BusinessPartnerCommandResult,
  BusinessPartnerDto,
  CreateBusinessPartnerInputDto,
  PartnerVersionInputDto,
  RemovePartnerRoleInputDto,
  UpdateBusinessPartnerInputDto,
} from '../domain/dtos/BusinessPartnerDtos'
import type { BusinessPartnerListQuery } from '../domain/validation/businessPartnerSchemas'
import { mapBusinessPartnerDtoToDomain } from '../domain/mappers/businessPartnerMappers'

function mapCommandError(e: { code: string; message: string; kind: string }): AppError {
  if (e.kind === 'not-found') return new NotFound('BusinessPartner', e.message)
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

    const response = await invoke<BusinessPartnerCommandResult<T>>(command, args)
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

export class TauriBusinessPartnerRepository implements IBusinessPartnerRepository {
  async list(query: BusinessPartnerListQuery): Promise<Result<BusinessPartner[], AppError>> {
    const result = await invokeResult<BusinessPartnerDto[]>('business_partner_list', { query })
    if (!result.ok) return result
    return ok(result.value.map(mapBusinessPartnerDtoToDomain))
  }

  async findById(id: BusinessPartnerId): Promise<Result<BusinessPartner, NotFoundError>> {
    const result = await invokeResult<BusinessPartnerDto>('business_partner_get_by_id', {
      partnerId: id.toString(),
    })
    if (!result.ok) return result as Result<BusinessPartner, NotFoundError>
    return ok(mapBusinessPartnerDtoToDomain(result.value))
  }

  async create(input: CreateBusinessPartnerInputDto): Promise<Result<BusinessPartner, AppError>> {
    const result = await invokeResult<BusinessPartnerDto>('business_partner_create', { input })
    if (!result.ok) return result
    return ok(mapBusinessPartnerDtoToDomain(result.value))
  }

  async update(input: UpdateBusinessPartnerInputDto): Promise<Result<BusinessPartner, AppError>> {
    const result = await invokeResult<BusinessPartnerDto>('business_partner_update', { input })
    if (!result.ok) return result
    return ok(mapBusinessPartnerDtoToDomain(result.value))
  }

  async activate(input: PartnerVersionInputDto): Promise<Result<BusinessPartner, AppError>> {
    const result = await invokeResult<BusinessPartnerDto>('business_partner_activate', { input })
    if (!result.ok) return result
    return ok(mapBusinessPartnerDtoToDomain(result.value))
  }

  async deactivate(input: PartnerVersionInputDto): Promise<Result<BusinessPartner, AppError>> {
    const result = await invokeResult<BusinessPartnerDto>('business_partner_deactivate', { input })
    if (!result.ok) return result
    return ok(mapBusinessPartnerDtoToDomain(result.value))
  }

  async assignRole(input: AssignPartnerRoleInputDto): Promise<Result<BusinessPartner, AppError>> {
    const result = await invokeResult<BusinessPartnerDto>('business_partner_assign_role', { input })
    if (!result.ok) return result
    return ok(mapBusinessPartnerDtoToDomain(result.value))
  }

  async removeRole(input: RemovePartnerRoleInputDto): Promise<Result<BusinessPartner, AppError>> {
    const result = await invokeResult<BusinessPartnerDto>('business_partner_remove_role', { input })
    if (!result.ok) return result
    return ok(mapBusinessPartnerDtoToDomain(result.value))
  }
}
