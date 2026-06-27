import type { FuelProductCode } from '@fuelms/shared'
import type { FuelTank } from '../../domain/entities/FuelTank'
import type { TankDipReading } from '../../domain/entities/TankDipReading'
import { milliLitresToLitres } from '../../domain/utils/quantity'

export type TankListItem = {
  id: string
  name: string
  productCode: FuelProductCode
  capacityLitres: number
  bookLitres: number
  fillPercent: number
  isActive: boolean
  displayOrder: number
  notes?: string
  lastDipLitres?: number
  lastDipAtIso?: string
  varianceLitres?: number
  version: number
}

export function mapTankToListItem(tank: FuelTank): TankListItem {
  return {
    id: tank.id.toString(),
    name: tank.name,
    productCode: tank.productCode,
    capacityLitres: milliLitresToLitres(tank.capacityMilliLitres),
    bookLitres: milliLitresToLitres(tank.bookMilliLitres),
    fillPercent: tank.fillPercent,
    isActive: tank.isActive,
    displayOrder: tank.displayOrder,
    notes: tank.notes,
    lastDipLitres:
      tank.lastDipMilliLitres != null
        ? milliLitresToLitres(tank.lastDipMilliLitres)
        : undefined,
    lastDipAtIso: tank.lastDipAtIso,
    varianceLitres:
      tank.varianceMilliLitres != null
        ? milliLitresToLitres(tank.varianceMilliLitres)
        : undefined,
    version: tank.version,
  }
}

export type DipListItem = {
  id: string
  readingAtIso: string
  quantityLitres: number
  recordedBy: string
  notes?: string
}

export function mapDipToListItem(dip: TankDipReading): DipListItem {
  return {
    id: dip.id,
    readingAtIso: dip.readingAt.toISOString(),
    quantityLitres: milliLitresToLitres(dip.quantityMilliLitres),
    recordedBy: dip.recordedBy,
    notes: dip.notes,
  }
}
