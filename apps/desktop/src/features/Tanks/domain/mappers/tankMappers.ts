import { isFuelProductCode } from '@fuelms/shared'
import type {
  CreateFuelTankInputDto,
  FuelTankDto,
  RecordTankDipInputDto,
  TankDipReadingDto,
  TankVersionInputDto,
  UpdateFuelTankInputDto,
} from '../dtos/TankDtos'
import type { FuelTank } from '../entities/FuelTank'
import { FuelTankId } from '../entities/FuelTank'
import type { TankDipReading } from '../entities/TankDipReading'
import type { CreateFuelTankInput, UpdateFuelTankInput } from '../validation/tankSchemas'
import { litresToMilliLitres } from '../utils/quantity'

function assertProductCode(code: string) {
  if (!isFuelProductCode(code)) {
    throw new Error(`Invalid fuel product code: ${code}`)
  }
  return code
}

export function mapFuelTankDtoToDomain(dto: FuelTankDto): FuelTank {
  return {
    id: FuelTankId.fromPersisted(dto.id),
    name: dto.name,
    productId: dto.productId,
    productCode: assertProductCode(dto.productCode),
    capacityMilliLitres: dto.capacityMilliLitres,
    isActive: dto.isActive,
    displayOrder: dto.displayOrder,
    notes: dto.notes ?? undefined,
    bookMilliLitres: dto.bookMilliLitres,
    fillPercent: dto.fillPercent,
    lastDipMilliLitres: dto.lastDipMilliLitres ?? undefined,
    lastDipAtIso: dto.lastDipAtIso ?? undefined,
    varianceMilliLitres: dto.varianceMilliLitres ?? undefined,
    createdAt: new Date(dto.createdAtIso),
    updatedAt: new Date(dto.updatedAtIso),
    version: dto.version,
  }
}

export function mapTankDipReadingDtoToDomain(dto: TankDipReadingDto): TankDipReading {
  return {
    id: dto.id,
    tankId: dto.tankId,
    readingAt: new Date(dto.readingAtIso),
    quantityMilliLitres: dto.quantityMilliLitres,
    recordedBy: dto.recordedBy,
    notes: dto.notes ?? undefined,
    createdAt: new Date(dto.createdAtIso),
    updatedAt: new Date(dto.updatedAtIso),
    version: dto.version,
  }
}

export function mapCreateTankInputToDto(input: CreateFuelTankInput): CreateFuelTankInputDto {
  return {
    name: input.name.trim(),
    productCode: input.productCode,
    capacityMilliLitres: litresToMilliLitres(input.capacityLitres),
    notes: input.notes?.trim() || undefined,
    displayOrder: input.displayOrder,
  }
}

export function mapUpdateTankInputToDto(input: UpdateFuelTankInput): UpdateFuelTankInputDto {
  return {
    id: input.id,
    name: input.name.trim(),
    capacityMilliLitres: litresToMilliLitres(input.capacityLitres),
    notes: input.notes?.trim() || undefined,
    displayOrder: input.displayOrder,
    version: input.version,
  }
}

export function mapTankVersionInputToDto(input: {
  tankId: string
  version: number
}): TankVersionInputDto {
  return {
    tankId: input.tankId,
    version: input.version,
  }
}

export function mapRecordDipInputToDto(
  input: { tankId: string; readingAtIso: string; quantityLitres: number; notes?: string },
  recordedBy: string,
): RecordTankDipInputDto {
  return {
    tankId: input.tankId,
    readingAtIso: input.readingAtIso,
    quantityMilliLitres: litresToMilliLitres(input.quantityLitres),
    notes: input.notes?.trim() || undefined,
    recordedBy,
  }
}

export function mapFuelTankToDto(tank: FuelTank): FuelTankDto {
  return {
    id: FuelTankId.toString(tank.id),
    name: tank.name,
    productId: tank.productId,
    productCode: tank.productCode,
    capacityMilliLitres: tank.capacityMilliLitres,
    isActive: tank.isActive,
    displayOrder: tank.displayOrder,
    notes: tank.notes ?? null,
    bookMilliLitres: tank.bookMilliLitres,
    fillPercent: tank.fillPercent,
    lastDipMilliLitres: tank.lastDipMilliLitres ?? null,
    lastDipAtIso: tank.lastDipAtIso ?? null,
    varianceMilliLitres: tank.varianceMilliLitres ?? null,
    createdAtIso: tank.createdAt.toISOString(),
    updatedAtIso: tank.updatedAt.toISOString(),
    version: tank.version,
  }
}
