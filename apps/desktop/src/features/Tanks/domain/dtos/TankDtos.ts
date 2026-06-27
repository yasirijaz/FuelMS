import type { FuelProductCode } from '@fuelms/shared'

export type TankCommandErrorDto = {
  code: string
  message: string
  kind: string
}

export type TankCommandResult<T> = {
  ok: boolean
  value?: T
  error?: TankCommandErrorDto
}

export type FuelTankDto = {
  id: string
  name: string
  productId: string
  productCode: FuelProductCode
  capacityMilliLitres: number
  isActive: boolean
  displayOrder: number
  notes?: string | null
  bookMilliLitres: number
  fillPercent: number
  lastDipMilliLitres?: number | null
  lastDipAtIso?: string | null
  varianceMilliLitres?: number | null
  createdAtIso: string
  updatedAtIso: string
  version: number
}

export type TankDipReadingDto = {
  id: string
  tankId: string
  readingAtIso: string
  quantityMilliLitres: number
  recordedBy: string
  notes?: string | null
  createdAtIso: string
  updatedAtIso: string
  version: number
}

export type CreateFuelTankInputDto = {
  name: string
  productCode: FuelProductCode
  capacityMilliLitres: number
  notes?: string
  displayOrder?: number
}

export type UpdateFuelTankInputDto = {
  id: string
  name: string
  capacityMilliLitres: number
  notes?: string
  displayOrder: number
  version: number
}

export type TankVersionInputDto = {
  tankId: string
  version: number
}

export type RecordTankDipInputDto = {
  tankId: string
  readingAtIso: string
  quantityMilliLitres: number
  notes?: string
  recordedBy: string
}
