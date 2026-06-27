import { ok, err } from '@fuelms/core'
import type { Result, AppError, NotFoundError } from '@fuelms/core'
import {
  NotFoundError as NotFound,
  ConflictError as Conflict,
  InfrastructureError,
} from '@fuelms/core'
import { env } from '@shared/lib/env'
import type { ITankRepository } from '../domain/repositories/ITankRepository'
import type { FuelTank, FuelTankId } from '../domain/entities/FuelTank'
import type { TankDipReading } from '../domain/entities/TankDipReading'
import type {
  CreateFuelTankInput,
  RecordTankDipInput,
  TankVersionInput,
  UpdateFuelTankInput,
} from '../domain/validation/tankSchemas'
import type {
  FuelTankDto,
  RecordTankDipInputDto,
  TankCommandResult,
  TankDipReadingDto,
  TankVersionInputDto,
  UpdateFuelTankInputDto,
} from '../domain/dtos/TankDtos'
import {
  mapCreateTankInputToDto,
  mapFuelTankDtoToDomain,
  mapRecordDipInputToDto,
  mapTankDipReadingDtoToDomain,
  mapTankVersionInputToDto,
  mapUpdateTankInputToDto,
} from '../domain/mappers/tankMappers'

function mapCommandError(e: { code: string; message: string; kind: string }): AppError {
  if (e.kind === 'not-found') return new NotFound('FuelTank', e.message)
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

    const response = await invoke<TankCommandResult<T>>(command, args)
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

export class TauriTankRepository implements ITankRepository {
  async list(activeOnly = true): Promise<Result<FuelTank[], AppError>> {
    const result = await invokeResult<FuelTankDto[]>('tank_list', { activeOnly })
    if (!result.ok) return result
    return ok(result.value.map(mapFuelTankDtoToDomain))
  }

  async findById(id: FuelTankId): Promise<Result<FuelTank, NotFoundError>> {
    const result = await invokeResult<FuelTankDto>('tank_get_by_id', {
      tankId: id.toString(),
    })
    if (!result.ok) return result as Result<FuelTank, NotFoundError>
    return ok(mapFuelTankDtoToDomain(result.value))
  }

  async create(input: CreateFuelTankInput): Promise<Result<FuelTank, AppError>> {
    const result = await invokeResult<FuelTankDto>('tank_create', {
      input: mapCreateTankInputToDto(input),
    })
    if (!result.ok) return result
    return ok(mapFuelTankDtoToDomain(result.value))
  }

  async update(input: UpdateFuelTankInput): Promise<Result<FuelTank, AppError>> {
    const payload: UpdateFuelTankInputDto = mapUpdateTankInputToDto(input)
    const result = await invokeResult<FuelTankDto>('tank_update', { input: payload })
    if (!result.ok) return result
    return ok(mapFuelTankDtoToDomain(result.value))
  }

  async activate(input: TankVersionInput): Promise<Result<FuelTank, AppError>> {
    const payload: TankVersionInputDto = mapTankVersionInputToDto(input)
    const result = await invokeResult<FuelTankDto>('tank_activate', { input: payload })
    if (!result.ok) return result
    return ok(mapFuelTankDtoToDomain(result.value))
  }

  async deactivate(input: TankVersionInput): Promise<Result<FuelTank, AppError>> {
    const payload: TankVersionInputDto = mapTankVersionInputToDto(input)
    const result = await invokeResult<FuelTankDto>('tank_deactivate', { input: payload })
    if (!result.ok) return result
    return ok(mapFuelTankDtoToDomain(result.value))
  }

  async recordDip(
    input: RecordTankDipInput,
    recordedBy: string,
  ): Promise<Result<TankDipReading, AppError>> {
    const payload: RecordTankDipInputDto = mapRecordDipInputToDto(input, recordedBy)
    const result = await invokeResult<TankDipReadingDto>('tank_record_dip', { input: payload })
    if (!result.ok) return result
    return ok(mapTankDipReadingDtoToDomain(result.value))
  }

  async listDips(tankId: string, limit = 20): Promise<Result<TankDipReading[], AppError>> {
    const result = await invokeResult<TankDipReadingDto[]>('tank_list_dips', { tankId, limit })
    if (!result.ok) return result
    return ok(result.value.map(mapTankDipReadingDtoToDomain))
  }
}
