import { ok, err } from '@fuelms/core'
import type { Result, AppError, NotFoundError, ConflictError } from '@fuelms/core'
import { ConflictError as Conflict, NotFoundError as NotFound } from '@fuelms/core'
import type { IFuelProductRepository } from '../../domain/priceManagement/repositories/IFuelProductRepository'
import type {
  IFuelPriceRecordRepository,
  PriceHistoryQuery,
  SavePriceRecordResult,
} from '../../domain/priceManagement/repositories/IFuelPriceRecordRepository'
import type { FuelProduct } from '../../domain/priceManagement/entities/FuelProduct'
import type { FuelProductCode } from '../../domain/priceManagement/valueObjects/FuelProductCode'
import { FuelProductId } from '../../domain/priceManagement/ids/FuelProductId'
import type { FuelPriceRecord } from '../../domain/priceManagement/entities/FuelPriceRecord'
import type { FuelPriceRecordId } from '../../domain/priceManagement/ids/FuelPriceRecordId'
import { mapPriceRecordToDto, mapPriceRecordDtoToDomain } from '../../domain/priceManagement/mappers/fuelPriceMappers'

const SEED_PRODUCTS: FuelProduct[] = [
  {
    id: FuelProductId.fromCode('petrol'),
    code: 'petrol',
    name: 'Petrol',
    unit: 'liter',
    displayOrder: 1,
  },
  {
    id: FuelProductId.fromCode('diesel'),
    code: 'diesel',
    name: 'Diesel',
    unit: 'liter',
    displayOrder: 2,
  },
  {
    id: FuelProductId.fromCode('hobc'),
    code: 'hobc',
    name: 'HOBC',
    unit: 'liter',
    displayOrder: 3,
  },
]

export class InMemoryFuelProductRepository implements IFuelProductRepository {
  async findAllActive(): Promise<Result<FuelProduct[], AppError>> {
    return ok([...SEED_PRODUCTS])
  }

  async findByCode(code: FuelProductCode): Promise<Result<FuelProduct, NotFoundError>> {
    const product = SEED_PRODUCTS.find((p) => p.code === code)
    if (!product) {
      return err(new NotFound('FuelProduct', code))
    }
    return ok(product)
  }

  async findById(id: FuelProductId): Promise<Result<FuelProduct, NotFoundError>> {
    const product = SEED_PRODUCTS.find((p) => p.id.toString() === id.toString())
    if (!product) {
      return err(new NotFound('FuelProduct', id.toString()))
    }
    return ok(product)
  }
}

/** Browser dev fallback — mirrors Tauri supersession rules in memory. */
export class InMemoryFuelPriceRecordRepository implements IFuelPriceRecordRepository {
  private readonly records = new Map<string, FuelPriceRecord>()

  async findById(id: FuelPriceRecordId): Promise<Result<FuelPriceRecord, NotFoundError>> {
    const record = this.records.get(id.toString())
    if (!record) {
      return err(new NotFound('FuelPriceRecord', id.toString()))
    }
    return ok(record)
  }

  async findActiveByProductId(
    productId: FuelProductId,
  ): Promise<Result<FuelPriceRecord | null, AppError>> {
    const active = [...this.records.values()].find(
      (record) => record.productId.toString() === productId.toString() && record.status === 'active',
    )
    return ok(active ?? null)
  }

  async findAllActive(): Promise<Result<FuelPriceRecord[], AppError>> {
    return ok([...this.records.values()].filter((record) => record.status === 'active'))
  }

  async findScheduledByProductId(
    productId: FuelProductId,
  ): Promise<Result<FuelPriceRecord[], AppError>> {
    return ok(
      [...this.records.values()].filter(
        (record) =>
          record.productId.toString() === productId.toString() && record.status === 'scheduled',
      ),
    )
  }

  async findDueScheduled(asOfIso: string): Promise<Result<FuelPriceRecord[], AppError>> {
    const asOf = new Date(asOfIso).getTime()
    return ok(
      [...this.records.values()].filter(
        (record) =>
          record.status === 'scheduled' && record.effectiveFrom.toDate().getTime() <= asOf,
      ),
    )
  }

  async findHistory(query: PriceHistoryQuery): Promise<Result<FuelPriceRecord[], AppError>> {
    let rows = [...this.records.values()]
    if (query.productId) {
      rows = rows.filter((record) => record.productId.toString() === query.productId!.toString())
    }
    if (query.fromIso) {
      const from = new Date(query.fromIso).getTime()
      rows = rows.filter((record) => record.effectiveFrom.toDate().getTime() >= from)
    }
    if (query.toIso) {
      const to = new Date(query.toIso).getTime()
      rows = rows.filter((record) => record.effectiveFrom.toDate().getTime() <= to)
    }
    rows.sort(
      (a, b) => b.effectiveFrom.toDate().getTime() - a.effectiveFrom.toDate().getTime(),
    )
    if (query.limit) {
      rows = rows.slice(0, query.limit)
    }
    return ok(rows)
  }

  async saveNew(
    record: FuelPriceRecord,
  ): Promise<Result<SavePriceRecordResult, AppError | ConflictError>> {
    let supersededRecord: FuelPriceRecord | null = null

    if (record.status === 'active') {
      const current = [...this.records.values()].find(
        (existing) =>
          existing.productId.toString() === record.productId.toString() &&
          existing.status === 'active',
      )
      if (current) {
        const supersedeResult = current.markSuperseded(record.id, record.effectiveFrom)
        if (!supersedeResult.ok) return supersedeResult
        this.records.set(current.id.toString(), current)
        supersededRecord = current
      }
    }

    this.records.set(record.id.toString(), record)
    return ok({ record, supersededRecord })
  }

  async update(record: FuelPriceRecord): Promise<Result<void, AppError | ConflictError>> {
    const existing = this.records.get(record.id.toString())
    if (!existing) {
      return err(new Conflict('NOT_FOUND', 'Price record was not found.'))
    }
    if (existing.isLocked) {
      return err(new Conflict('PRICE_LOCKED', 'This price record cannot be modified.'))
    }
    this.records.set(record.id.toString(), record)
    return ok(undefined)
  }

  /** Test helper — seed from DTO snapshots. */
  seedFromDtos(dtos: ReturnType<typeof mapPriceRecordToDto>[]): void {
    for (const dto of dtos) {
      const record = mapPriceRecordDtoToDomain(dto)
      this.records.set(record.id.toString(), record)
    }
  }

  clear(): void {
    this.records.clear()
  }
}
