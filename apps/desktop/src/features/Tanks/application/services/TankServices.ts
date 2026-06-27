import { err } from '@fuelms/core'
import type { Result, AppError } from '@fuelms/core'
import { ValidationError } from '@fuelms/core'
import type { ITankRepository } from '../../domain/repositories/ITankRepository'
import { FuelTankId } from '../../domain/entities/FuelTank'
import type { FuelTank } from '../../domain/entities/FuelTank'
import type { TankDipReading } from '../../domain/entities/TankDipReading'
import {
  createFuelTankInputSchema,
  recordTankDipInputSchema,
  tankVersionInputSchema,
  updateFuelTankInputSchema,
  type CreateFuelTankInput,
  type RecordTankDipInput,
  type TankVersionInput,
  type UpdateFuelTankInput,
} from '../../domain'

/** Default actor until authentication is introduced. */
export const TANK_DEFAULT_ACTOR = 'owner'

export class ListTanksService {
  constructor(private readonly repository: ITankRepository) {}

  async execute(activeOnly = true): Promise<Result<FuelTank[], AppError>> {
    return this.repository.list(activeOnly)
  }
}

export class GetTankService {
  constructor(private readonly repository: ITankRepository) {}

  async execute(tankId: string): Promise<Result<FuelTank, AppError>> {
    if (!tankId.trim()) {
      return err(new ValidationError('Tank id is required.'))
    }

    return this.repository.findById(FuelTankId.fromPersisted(tankId))
  }
}

export class CreateTankService {
  constructor(private readonly repository: ITankRepository) {}

  async execute(input: CreateFuelTankInput): Promise<Result<FuelTank, AppError>> {
    const parsed = createFuelTankInputSchema.safeParse(input)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return err(new ValidationError(first?.message ?? 'Invalid tank input.'))
    }

    return this.repository.create(parsed.data)
  }
}

export class UpdateTankService {
  constructor(private readonly repository: ITankRepository) {}

  async execute(input: UpdateFuelTankInput): Promise<Result<FuelTank, AppError>> {
    const parsed = updateFuelTankInputSchema.safeParse(input)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return err(new ValidationError(first?.message ?? 'Invalid tank input.'))
    }

    return this.repository.update(parsed.data)
  }
}

export class ActivateTankService {
  constructor(private readonly repository: ITankRepository) {}

  async execute(input: TankVersionInput): Promise<Result<FuelTank, AppError>> {
    const parsed = tankVersionInputSchema.safeParse(input)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return err(new ValidationError(first?.message ?? 'Invalid tank version input.'))
    }

    return this.repository.activate(parsed.data)
  }
}

export class DeactivateTankService {
  constructor(private readonly repository: ITankRepository) {}

  async execute(input: TankVersionInput): Promise<Result<FuelTank, AppError>> {
    const parsed = tankVersionInputSchema.safeParse(input)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return err(new ValidationError(first?.message ?? 'Invalid tank version input.'))
    }

    return this.repository.deactivate(parsed.data)
  }
}

export class RecordTankDipService {
  constructor(private readonly repository: ITankRepository) {}

  async execute(
    input: RecordTankDipInput,
    recordedBy: string = TANK_DEFAULT_ACTOR,
  ): Promise<Result<TankDipReading, AppError>> {
    const parsed = recordTankDipInputSchema.safeParse(input)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return err(new ValidationError(first?.message ?? 'Invalid dip input.'))
    }

    return this.repository.recordDip(parsed.data, recordedBy)
  }
}

export class ListTankDipsService {
  constructor(private readonly repository: ITankRepository) {}

  async execute(tankId: string, limit = 20): Promise<Result<TankDipReading[], AppError>> {
    if (!tankId.trim()) {
      return err(new ValidationError('Tank id is required.'))
    }

    return this.repository.listDips(tankId, limit)
  }
}
