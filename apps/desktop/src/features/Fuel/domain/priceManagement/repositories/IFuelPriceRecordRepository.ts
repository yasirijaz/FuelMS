import type { Result, AppError, NotFoundError, ConflictError } from '@fuelms/core'
import type { FuelPriceRecord } from '../entities/FuelPriceRecord'
import type { FuelPriceRecordId } from '../ids/FuelPriceRecordId'
import type { FuelProductId } from '../ids/FuelProductId'
import type { FuelPriceChangeBatchId } from '../ids/FuelPriceChangeBatchId'

export interface PriceHistoryQuery {
  productId?: FuelProductId
  fromIso?: string
  toIso?: string
  limit?: number
}

export interface SavePriceRecordResult {
  record: FuelPriceRecord
  supersededRecord: FuelPriceRecord | null
}

/**
 * Persistence contract for fuel selling price records.
 * Implementations live in infrastructure (Tauri/SQLite).
 */
export interface IFuelPriceRecordRepository {
  findById(id: FuelPriceRecordId): Promise<Result<FuelPriceRecord, NotFoundError>>

  findActiveByProductId(productId: FuelProductId): Promise<Result<FuelPriceRecord | null, AppError>>

  findAllActive(): Promise<Result<FuelPriceRecord[], AppError>>

  findScheduledByProductId(productId: FuelProductId): Promise<Result<FuelPriceRecord[], AppError>>

  findDueScheduled(asOfIso: string): Promise<Result<FuelPriceRecord[], AppError>>

  findHistory(query: PriceHistoryQuery): Promise<Result<FuelPriceRecord[], AppError>>

  /**
   * Persist a new price record. When status is active, supersedes the current active
   * record for the same product inside one transaction.
   */
  saveNew(record: FuelPriceRecord): Promise<Result<SavePriceRecordResult, AppError | ConflictError>>

  /** Update an existing record (status transitions only — scheduled cancel, supersede). */
  update(record: FuelPriceRecord): Promise<Result<void, AppError | ConflictError>>
}

export interface FuelPriceChangeBatch {
  readonly id: FuelPriceChangeBatchId
  readonly reason: string | null
  readonly reference: string | null
  readonly recordedBy: string
  readonly createdAtIso: string
}

export interface IFuelPriceChangeBatchRepository {
  save(batch: FuelPriceChangeBatch): Promise<Result<void, AppError>>
}

export interface IFuelPriceAuditRepository {
  logBlockedEdit(params: {
    productId: string
    priceRecordId: string
    actorId: string
    detail: Record<string, unknown>
  }): Promise<Result<void, AppError>>
}
