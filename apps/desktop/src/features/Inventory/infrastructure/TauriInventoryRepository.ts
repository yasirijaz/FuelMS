import { ok, err } from '@fuelms/core'
import type { Result, AppError } from '@fuelms/core'
import {
  NotFoundError as NotFound,
  ConflictError as Conflict,
  InfrastructureError,
} from '@fuelms/core'
import { env } from '@shared/lib/env'
import type { IInventoryRepository } from '../domain/repositories/IInventoryRepository'
import type { InventoryBatch } from '../domain/entities/InventoryBatch'
import type { InventoryMovement } from '../domain/entities/InventoryMovement'
import type { InventoryProductSummary } from '../domain/entities/InventoryProductSummary'
import type {
  InventoryBatchListQueryDto,
  InventoryCommandResult,
  InventoryBatchDto,
  InventoryMovementDto,
  InventoryMovementListQueryDto,
  InventoryProductSummaryDto,
} from '../domain/dtos/InventoryDtos'
import type {
  InventoryBatchListQuery,
  InventoryMovementListQuery,
} from '../domain/validation/inventorySchemas'
import {
  mapInventoryBatchDtoToDomain,
  mapInventoryMovementDtoToDomain,
  mapInventoryProductSummaryDtoToDomain,
} from '../domain/mappers/inventoryMappers'

function mapCommandError(e: { code: string; message: string; kind: string }): AppError {
  if (e.kind === 'not-found') return new NotFound('Inventory', e.message)
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

    const response = await invoke<InventoryCommandResult<T>>(command, args)
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

export class TauriInventoryRepository implements IInventoryRepository {
  async productSummary(): Promise<Result<InventoryProductSummary[], AppError>> {
    const result = await invokeResult<InventoryProductSummaryDto[]>('inventory_product_summary')
    if (!result.ok) return result
    return ok(result.value.map(mapInventoryProductSummaryDtoToDomain))
  }

  async listBatches(query: InventoryBatchListQuery): Promise<Result<InventoryBatch[], AppError>> {
    const payload: InventoryBatchListQueryDto = {
      productCode: query.productCode,
      activeOnly: query.activeOnly,
    }
    const result = await invokeResult<InventoryBatchDto[]>('inventory_list_batches', {
      query: payload,
    })
    if (!result.ok) return result
    return ok(result.value.map(mapInventoryBatchDtoToDomain))
  }

  async listMovements(
    query: InventoryMovementListQuery,
  ): Promise<Result<InventoryMovement[], AppError>> {
    const payload: InventoryMovementListQueryDto = {
      productCode: query.productCode,
      limit: query.limit,
    }
    const result = await invokeResult<InventoryMovementDto[]>('inventory_list_movements', {
      query: payload,
    })
    if (!result.ok) return result
    return ok(result.value.map(mapInventoryMovementDtoToDomain))
  }
}
