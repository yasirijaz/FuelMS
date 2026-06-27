import { ok, err } from '@fuelms/core'
import type { Result, AppError, NotFoundError } from '@fuelms/core'
import {
  NotFoundError as NotFound,
  ConflictError as Conflict,
  InfrastructureError,
} from '@fuelms/core'
import { env } from '@shared/lib/env'
import type { IFuelSaleRepository } from '../domain/repositories/IFuelSaleRepository'
import type { FuelSale } from '../domain/entities/FuelSale'
import type { FuelSaleId } from '../domain/ids/FuelSaleId'
import type {
  FuelSaleCommandResult,
  FuelSaleDto,
  PostFuelSaleInputDto,
  ProductStockDto,
  RecordFuelSaleInputDto,
  VoidFuelSaleInputDto,
} from '../domain/dtos/SaleDtos'
import type { FuelSaleListQuery } from '../domain/validation/saleSchemas'
import { mapFuelSaleDtoToDomain } from '../domain/mappers/saleMappers'

function mapCommandError(e: { code: string; message: string; kind: string }): AppError {
  if (e.kind === 'not-found') return new NotFound('FuelSale', e.message)
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

    const response = await invoke<FuelSaleCommandResult<T>>(command, args)
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

export class TauriFuelSaleRepository implements IFuelSaleRepository {
  async list(query: FuelSaleListQuery): Promise<Result<FuelSale[], AppError>> {
    const result = await invokeResult<FuelSaleDto[]>('fuel_sale_list', { query })
    if (!result.ok) return result
    return ok(result.value.map(mapFuelSaleDtoToDomain))
  }

  async findById(id: FuelSaleId): Promise<Result<FuelSale, NotFoundError>> {
    const result = await invokeResult<FuelSaleDto>('fuel_sale_get_by_id', {
      saleId: id.toString(),
    })
    if (!result.ok) return result as Result<FuelSale, NotFoundError>
    return ok(mapFuelSaleDtoToDomain(result.value))
  }

  async getAvailableStock(productCode: string): Promise<Result<ProductStockDto, AppError>> {
    return invokeResult<ProductStockDto>('fuel_sale_available_stock', { productCode })
  }

  async record(input: RecordFuelSaleInputDto): Promise<Result<FuelSale, AppError>> {
    const result = await invokeResult<FuelSaleDto>('fuel_sale_record', { input })
    if (!result.ok) return result
    return ok(mapFuelSaleDtoToDomain(result.value))
  }

  async post(input: PostFuelSaleInputDto): Promise<Result<FuelSale, AppError>> {
    const result = await invokeResult<FuelSaleDto>('fuel_sale_post', { input })
    if (!result.ok) return result
    return ok(mapFuelSaleDtoToDomain(result.value))
  }

  async void(input: VoidFuelSaleInputDto): Promise<Result<FuelSale, AppError>> {
    const result = await invokeResult<FuelSaleDto>('fuel_sale_void', { input })
    if (!result.ok) return result
    return ok(mapFuelSaleDtoToDomain(result.value))
  }
}
