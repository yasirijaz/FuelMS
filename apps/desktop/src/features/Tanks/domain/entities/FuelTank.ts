import type { FuelProductCode } from '@fuelms/shared'

export type FuelTankId = string & { readonly __brand: 'FuelTankId' }

export const FuelTankId = {
  fromPersisted(value: string): FuelTankId {
    return value as FuelTankId
  },
  toString(id: FuelTankId): string {
    return id
  },
}

export type FuelTank = {
  id: FuelTankId
  name: string
  productId: string
  productCode: FuelProductCode
  capacityMilliLitres: number
  isActive: boolean
  displayOrder: number
  notes?: string
  bookMilliLitres: number
  fillPercent: number
  lastDipMilliLitres?: number
  lastDipAtIso?: string
  varianceMilliLitres?: number
  createdAt: Date
  updatedAt: Date
  version: number
}
