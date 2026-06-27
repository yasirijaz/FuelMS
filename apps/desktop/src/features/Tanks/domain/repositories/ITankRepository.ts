import type { Result, AppError, NotFoundError } from '@fuelms/core'
import type { FuelTank, FuelTankId } from '../entities/FuelTank'
import type { TankDipReading } from '../entities/TankDipReading'
import type {
  CreateFuelTankInput,
  RecordTankDipInput,
  TankVersionInput,
  UpdateFuelTankInput,
} from '../validation/tankSchemas'

export interface ITankRepository {
  list(activeOnly?: boolean): Promise<Result<FuelTank[], AppError>>
  findById(id: FuelTankId): Promise<Result<FuelTank, NotFoundError>>
  create(input: CreateFuelTankInput): Promise<Result<FuelTank, AppError>>
  update(input: UpdateFuelTankInput): Promise<Result<FuelTank, AppError>>
  activate(input: TankVersionInput): Promise<Result<FuelTank, AppError>>
  deactivate(input: TankVersionInput): Promise<Result<FuelTank, AppError>>
  recordDip(input: RecordTankDipInput, recordedBy: string): Promise<Result<TankDipReading, AppError>>
  listDips(tankId: string, limit?: number): Promise<Result<TankDipReading[], AppError>>
}
