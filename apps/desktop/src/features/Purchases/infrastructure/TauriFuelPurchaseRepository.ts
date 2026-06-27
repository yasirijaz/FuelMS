import { ok, err } from '@fuelms/core'
import type { Result, AppError, NotFoundError } from '@fuelms/core'
import {
  NotFoundError as NotFound,
  ConflictError as Conflict,
  InfrastructureError,
} from '@fuelms/core'
import { env } from '@shared/lib/env'
import type { IFuelPurchaseRepository } from '../domain/repositories/IFuelPurchaseRepository'
import type { FuelPurchase } from '../domain/entities/FuelPurchase'
import type { FuelPurchaseId } from '../domain/ids/FuelPurchaseId'
import type {
  FuelPurchaseCommandResult,
  FuelPurchaseDto,
  PostFuelPurchaseInputDto,
  RecordFuelPurchaseInputDto,
  VoidFuelPurchaseInputDto,
} from '../domain/dtos/PurchaseDtos'
import type { FuelPurchaseListQuery } from '../domain/validation/purchaseSchemas'
import { mapFuelPurchaseDtoToDomain } from '../domain/mappers/purchaseMappers'

function mapCommandError(e: { code: string; message: string; kind: string }): AppError {
  if (e.kind === 'not-found') return new NotFound('FuelPurchase', e.message)
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

    const response = await invoke<FuelPurchaseCommandResult<T>>(command, args)
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

export class TauriFuelPurchaseRepository implements IFuelPurchaseRepository {
  async list(query: FuelPurchaseListQuery): Promise<Result<FuelPurchase[], AppError>> {
    const result = await invokeResult<FuelPurchaseDto[]>('fuel_purchase_list', { query })
    if (!result.ok) return result
    return ok(result.value.map(mapFuelPurchaseDtoToDomain))
  }

  async findById(id: FuelPurchaseId): Promise<Result<FuelPurchase, NotFoundError>> {
    const result = await invokeResult<FuelPurchaseDto>('fuel_purchase_get_by_id', {
      purchaseId: id.toString(),
    })
    if (!result.ok) return result as Result<FuelPurchase, NotFoundError>
    return ok(mapFuelPurchaseDtoToDomain(result.value))
  }

  async record(input: RecordFuelPurchaseInputDto): Promise<Result<FuelPurchase, AppError>> {
    const result = await invokeResult<FuelPurchaseDto>('fuel_purchase_record', { input })
    if (!result.ok) return result
    return ok(mapFuelPurchaseDtoToDomain(result.value))
  }

  async post(input: PostFuelPurchaseInputDto): Promise<Result<FuelPurchase, AppError>> {
    const result = await invokeResult<FuelPurchaseDto>('fuel_purchase_post', { input })
    if (!result.ok) return result
    return ok(mapFuelPurchaseDtoToDomain(result.value))
  }

  async void(input: VoidFuelPurchaseInputDto): Promise<Result<FuelPurchase, AppError>> {
    const result = await invokeResult<FuelPurchaseDto>('fuel_purchase_void', { input })
    if (!result.ok) return result
    return ok(mapFuelPurchaseDtoToDomain(result.value))
  }
}
