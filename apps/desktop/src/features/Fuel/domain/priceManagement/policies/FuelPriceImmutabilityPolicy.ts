import type { FuelPriceStatus } from '../valueObjects/FuelPriceStatus'

/**
 * Immutability policy — spec: price history immutable once active or used by a sale.
 */
export function canModifyPriceRecord(status: FuelPriceStatus, isLocked: boolean): boolean {
  if (isLocked) return false
  return status === 'scheduled'
}

export function canCancelPriceRecord(status: FuelPriceStatus, isLocked: boolean): boolean {
  if (isLocked) return false
  return status === 'scheduled'
}

export function isHistoricalPriceRecord(status: FuelPriceStatus): boolean {
  return status === 'active' || status === 'superseded'
}
