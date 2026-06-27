import { invoke } from '@tauri-apps/api/core'
import { ok, err } from '@fuelms/core'
import type { Result, AppError, NotFoundError, ConflictError } from '@fuelms/core'
import { NotFoundError as NotFound, ConflictError as Conflict, InfrastructureError } from '@fuelms/core'
import type { IFuelProductRepository } from '../../domain/priceManagement/repositories/IFuelProductRepository'
import type {
  IFuelPriceRecordRepository,
  IFuelPriceAuditRepository,
  PriceHistoryQuery,
  SavePriceRecordResult,
  FuelPriceChangeBatch,
  IFuelPriceChangeBatchRepository,
} from '../../domain/priceManagement/repositories/IFuelPriceRecordRepository'
import type { FuelProduct } from '../../domain/priceManagement/entities/FuelProduct'
import type { FuelProductCode } from '../../domain/priceManagement/valueObjects/FuelProductCode'
import type { FuelProductId } from '../../domain/priceManagement/ids/FuelProductId'
import type { FuelPriceRecord } from '../../domain/priceManagement/entities/FuelPriceRecord'
import type { FuelPriceRecordId } from '../../domain/priceManagement/ids/FuelPriceRecordId'
import type {
  FuelProductDto,
  FuelPriceRecordDto,
  FuelPriceCommandResult,
  SaveFuelPriceRecordResponse,
  PriceHistoryQueryDto,
} from '../../domain/priceManagement/dtos/FuelPriceDtos'
import {
  mapProductDtoToDomain,
  mapPriceRecordDtoToDomain,
  mapPriceRecordToDto,
} from '../../domain/priceManagement/mappers/fuelPriceMappers'

function mapCommandError(e: { code: string; message: string; kind: string }): AppError {
  if (e.kind === 'not-found') return new NotFound('FuelPrice', e.message)
  if (e.kind === 'conflict') return new Conflict(e.code, e.message)
  return new InfrastructureError(e.code, e.message)
}

async function invokeResult<T>(command: string, args?: Record<string, unknown>): Promise<Result<T, AppError>> {
  try {
    const response = await invoke<FuelPriceCommandResult<T>>(command, args)
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

export class TauriFuelProductRepository implements IFuelProductRepository {
  async findAllActive(): Promise<Result<FuelProduct[], AppError>> {
    const result = await invokeResult<FuelProductDto[]>('fuel_price_list_products')
    if (!result.ok) return result
    return ok(result.value.map(mapProductDtoToDomain))
  }

  async findByCode(code: FuelProductCode): Promise<Result<FuelProduct, NotFoundError>> {
    const result = await invokeResult<FuelProductDto>('fuel_price_get_product_by_code', { code })
    if (!result.ok) return result as Result<FuelProduct, NotFoundError>
    return ok(mapProductDtoToDomain(result.value))
  }

  async findById(id: FuelProductId): Promise<Result<FuelProduct, NotFoundError>> {
    const result = await invokeResult<FuelProductDto>('fuel_price_get_product_by_id', {
      productId: id.toString(),
    })
    if (!result.ok) return result as Result<FuelProduct, NotFoundError>
    return ok(mapProductDtoToDomain(result.value))
  }
}

export class TauriFuelPriceRecordRepository implements IFuelPriceRecordRepository {
  async findById(id: FuelPriceRecordId): Promise<Result<FuelPriceRecord, NotFoundError>> {
    const result = await invokeResult<FuelPriceRecordDto>('fuel_price_get_record_by_id', {
      recordId: id.toString(),
    })
    if (!result.ok) return result as Result<FuelPriceRecord, NotFoundError>
    return ok(mapPriceRecordDtoToDomain(result.value))
  }

  async findActiveByProductId(
    productId: FuelProductId,
  ): Promise<Result<FuelPriceRecord | null, AppError>> {
    const result = await invokeResult<FuelPriceRecordDto | null>('fuel_price_get_active_by_product', {
      productId: productId.toString(),
    })
    if (!result.ok) return result
    return ok(result.value ? mapPriceRecordDtoToDomain(result.value) : null)
  }

  async findAllActive(): Promise<Result<FuelPriceRecord[], AppError>> {
    const result = await invokeResult<FuelPriceRecordDto[]>('fuel_price_list_active')
    if (!result.ok) return result
    return ok(result.value.map(mapPriceRecordDtoToDomain))
  }

  async findScheduledByProductId(
    productId: FuelProductId,
  ): Promise<Result<FuelPriceRecord[], AppError>> {
    const result = await invokeResult<FuelPriceRecordDto[]>('fuel_price_list_scheduled_by_product', {
      productId: productId.toString(),
    })
    if (!result.ok) return result
    return ok(result.value.map(mapPriceRecordDtoToDomain))
  }

  async findDueScheduled(asOfIso: string): Promise<Result<FuelPriceRecord[], AppError>> {
    const result = await invokeResult<FuelPriceRecordDto[]>('fuel_price_list_due_scheduled', {
      asOfIso,
    })
    if (!result.ok) return result
    return ok(result.value.map(mapPriceRecordDtoToDomain))
  }

  async findHistory(query: PriceHistoryQuery): Promise<Result<FuelPriceRecord[], AppError>> {
    const payload: PriceHistoryQueryDto = {
      productId: query.productId?.toString(),
      fromIso: query.fromIso,
      toIso: query.toIso,
      limit: query.limit,
    }
    const result = await invokeResult<FuelPriceRecordDto[]>('fuel_price_list_history', { query: payload })
    if (!result.ok) return result
    return ok(result.value.map(mapPriceRecordDtoToDomain))
  }

  async saveNew(
    record: FuelPriceRecord,
  ): Promise<Result<SavePriceRecordResult, AppError | ConflictError>> {
    const result = await invokeResult<SaveFuelPriceRecordResponse>('fuel_price_save_new', {
      record: mapPriceRecordToDto(record),
    })
    if (!result.ok) return result
    return ok({
      record: mapPriceRecordDtoToDomain(result.value.record),
      supersededRecord: result.value.supersededRecord
        ? mapPriceRecordDtoToDomain(result.value.supersededRecord)
        : null,
    })
  }

  async update(record: FuelPriceRecord): Promise<Result<void, AppError | ConflictError>> {
    const result = await invokeResult<void>('fuel_price_update_record', {
      record: mapPriceRecordToDto(record),
    })
    return result
  }
}

export class TauriFuelPriceChangeBatchRepository implements IFuelPriceChangeBatchRepository {
  async save(batch: FuelPriceChangeBatch): Promise<Result<void, AppError>> {
    return invokeResult<void>('fuel_price_save_batch', {
      batch: {
        id: batch.id.toString(),
        reason: batch.reason,
        reference: batch.reference,
        recordedBy: batch.recordedBy,
        createdAtIso: batch.createdAtIso,
      },
    })
  }
}

export class TauriFuelPriceAuditRepository implements IFuelPriceAuditRepository {
  async logBlockedEdit(params: {
    productId: string
    priceRecordId: string
    actorId: string
    detail: Record<string, unknown>
  }): Promise<Result<void, AppError>> {
    return invokeResult<void>('fuel_price_log_blocked_edit', params)
  }
}
