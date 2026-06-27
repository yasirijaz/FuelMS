import { ok, err } from '@fuelms/core'
import type { Result, AppError, NotFoundError } from '@fuelms/core'
import { ConflictError, NotFoundError as NotFound } from '@fuelms/core'
import type { ITankRepository } from '../domain/repositories/ITankRepository'
import type { FuelTank } from '../domain/entities/FuelTank'
import { FuelTankId } from '../domain/entities/FuelTank'
import type { TankDipReading } from '../domain/entities/TankDipReading'
import type {
  CreateFuelTankInput,
  RecordTankDipInput,
  TankVersionInput,
  UpdateFuelTankInput,
} from '../domain/validation/tankSchemas'
import { litresToMilliLitres } from '../domain/utils/quantity'

const PRODUCT_IDS: Record<string, string> = {
  petrol: 'product-petrol',
  diesel: 'product-diesel',
  hobc: 'product-hobc',
}

function computeFillPercent(bookMilli: number, capacityMilli: number): number {
  if (capacityMilli <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((bookMilli * 100) / capacityMilli)))
}

function seedTanks(): FuelTank[] {
  const now = new Date('2026-06-26T08:00:00.000Z')
  return [
    {
      id: FuelTankId.fromPersisted('tank-petrol-main'),
      name: 'Petrol Tank 1',
      productId: PRODUCT_IDS.petrol!,
      productCode: 'petrol',
      capacityMilliLitres: 20_000_000,
      isActive: true,
      displayOrder: 1,
      bookMilliLitres: 4_200_000,
      fillPercent: 21,
      lastDipMilliLitres: 4_100_000,
      lastDipAtIso: '2026-06-25T18:00:00.000Z',
      varianceMilliLitres: -100_000,
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
    {
      id: FuelTankId.fromPersisted('tank-diesel-main'),
      name: 'Diesel Tank 1',
      productId: PRODUCT_IDS.diesel!,
      productCode: 'diesel',
      capacityMilliLitres: 30_000_000,
      isActive: true,
      displayOrder: 2,
      bookMilliLitres: 7_500_000,
      fillPercent: 25,
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
    {
      id: FuelTankId.fromPersisted('tank-hobc-main'),
      name: 'HOBC Tank 1',
      productId: PRODUCT_IDS.hobc!,
      productCode: 'hobc',
      capacityMilliLitres: 10_000_000,
      isActive: true,
      displayOrder: 3,
      bookMilliLitres: 0,
      fillPercent: 0,
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
  ]
}

export class InMemoryTankRepository implements ITankRepository {
  private readonly tanks = new Map<string, FuelTank>()
  private dips: TankDipReading[] = []

  constructor() {
    for (const tank of seedTanks()) {
      this.tanks.set(FuelTankId.toString(tank.id), tank)
    }
  }

  private getTank(id: FuelTankId): FuelTank | undefined {
    return this.tanks.get(FuelTankId.toString(id))
  }

  private putTank(tank: FuelTank): void {
    this.tanks.set(FuelTankId.toString(tank.id), tank)
  }

  async list(activeOnly = true): Promise<Result<FuelTank[], AppError>> {
    let rows = [...this.tanks.values()]
    if (activeOnly) {
      rows = rows.filter((tank) => tank.isActive)
    }
    rows.sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name))
    return ok(rows)
  }

  async findById(id: FuelTankId): Promise<Result<FuelTank, NotFoundError>> {
    const tank = this.getTank(id)
    if (!tank) {
      return err(new NotFound('FuelTank', FuelTankId.toString(id)))
    }
    return ok(tank)
  }

  async create(input: CreateFuelTankInput): Promise<Result<FuelTank, AppError>> {
    const id = FuelTankId.fromPersisted(`tank-${crypto.randomUUID()}`)
    const now = new Date()
    const tank: FuelTank = {
      id,
      name: input.name.trim(),
      productId: PRODUCT_IDS[input.productCode] ?? input.productCode,
      productCode: input.productCode,
      capacityMilliLitres: litresToMilliLitres(input.capacityLitres),
      isActive: true,
      displayOrder: input.displayOrder ?? 0,
      notes: input.notes?.trim(),
      bookMilliLitres: 0,
      fillPercent: 0,
      createdAt: now,
      updatedAt: now,
      version: 1,
    }
    this.putTank(tank)
    return ok(tank)
  }

  async update(input: UpdateFuelTankInput): Promise<Result<FuelTank, AppError>> {
    const tank = this.getTank(FuelTankId.fromPersisted(input.id))
    if (!tank) {
      return err(new NotFound('FuelTank', input.id))
    }
    if (tank.version !== input.version) {
      return err(
        new ConflictError(
          'TANK_VERSION_CONFLICT',
          'Tank was modified by another process. Refresh and try again.',
        ),
      )
    }

    const capacityMilliLitres = litresToMilliLitres(input.capacityLitres)
    const updated: FuelTank = {
      ...tank,
      name: input.name.trim(),
      capacityMilliLitres,
      notes: input.notes?.trim(),
      displayOrder: input.displayOrder,
      fillPercent: computeFillPercent(tank.bookMilliLitres, capacityMilliLitres),
      updatedAt: new Date(),
      version: tank.version + 1,
    }
    this.putTank(updated)
    return ok(updated)
  }

  async activate(input: TankVersionInput): Promise<Result<FuelTank, AppError>> {
    return this.setActive(input, true)
  }

  async deactivate(input: TankVersionInput): Promise<Result<FuelTank, AppError>> {
    return this.setActive(input, false)
  }

  private async setActive(
    input: TankVersionInput,
    active: boolean,
  ): Promise<Result<FuelTank, AppError>> {
    const tank = this.getTank(FuelTankId.fromPersisted(input.tankId))
    if (!tank) {
      return err(new NotFound('FuelTank', input.tankId))
    }
    if (tank.version !== input.version) {
      return err(
        new ConflictError(
          'TANK_VERSION_CONFLICT',
          'Tank was modified by another process. Refresh and try again.',
        ),
      )
    }

    const updated: FuelTank = {
      ...tank,
      isActive: active,
      updatedAt: new Date(),
      version: tank.version + 1,
    }
    this.putTank(updated)
    return ok(updated)
  }

  async recordDip(
    input: RecordTankDipInput,
    recordedBy: string,
  ): Promise<Result<TankDipReading, AppError>> {
    const tank = this.getTank(FuelTankId.fromPersisted(input.tankId))
    if (!tank) {
      return err(new NotFound('FuelTank', input.tankId))
    }

    const quantityMilliLitres = litresToMilliLitres(input.quantityLitres)
    if (quantityMilliLitres > tank.capacityMilliLitres) {
      return err(
        new ConflictError('DIP_EXCEEDS_CAPACITY', 'Dip reading cannot exceed tank capacity.'),
      )
    }

    const now = new Date()
    const dip: TankDipReading = {
      id: `dip-${crypto.randomUUID()}`,
      tankId: input.tankId,
      readingAt: new Date(input.readingAtIso),
      quantityMilliLitres,
      recordedBy,
      notes: input.notes?.trim(),
      createdAt: now,
      updatedAt: now,
      version: 1,
    }
    this.dips.unshift(dip)

    const variance = quantityMilliLitres - tank.bookMilliLitres
    const updated: FuelTank = {
      ...tank,
      lastDipMilliLitres: quantityMilliLitres,
      lastDipAtIso: input.readingAtIso,
      varianceMilliLitres: variance,
      updatedAt: now,
      version: tank.version + 1,
    }
    this.putTank(updated)

    return ok(dip)
  }

  async listDips(tankId: string, limit = 20): Promise<Result<TankDipReading[], AppError>> {
    const tank = this.getTank(FuelTankId.fromPersisted(tankId))
    if (!tank) {
      return err(new NotFound('FuelTank', tankId))
    }

    const rows = this.dips
      .filter((dip) => dip.tankId === tankId)
      .sort((a, b) => b.readingAt.getTime() - a.readingAt.getTime())
      .slice(0, limit)

    return ok(rows)
  }
}
