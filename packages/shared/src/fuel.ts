import { FUEL_QUANTITY_PRECISION } from './constants'

export function roundFuelQuantity(litres: number): number {
  const factor = 10 ** FUEL_QUANTITY_PRECISION
  return Math.round(litres * factor) / factor
}

export function formatFuelQuantity(litres: number): string {
  return `${roundFuelQuantity(litres).toFixed(FUEL_QUANTITY_PRECISION)} L`
}

/** Parse litres text (up to 3 decimal places). Returns null when invalid. */
export function parseFuelQuantityInput(raw: string): number | null {
  const normalized = raw.trim().replace(/,/g, '')
  if (normalized.length === 0) return null
  if (!/^\d+(\.\d*)?$/.test(normalized)) return null

  const litres = Number(normalized)
  if (!Number.isFinite(litres) || litres < 0) return null

  return roundFuelQuantity(litres)
}

export const FUEL_PRODUCT_CODES = ['petrol', 'diesel', 'hobc'] as const
export type FuelProductCode = (typeof FUEL_PRODUCT_CODES)[number]

export function isFuelProductCode(value: string): value is FuelProductCode {
  return (FUEL_PRODUCT_CODES as readonly string[]).includes(value)
}

export function fuelProductDisplayName(code: FuelProductCode): string {
  switch (code) {
    case 'petrol':
      return 'Petrol'
    case 'diesel':
      return 'Diesel'
    case 'hobc':
      return 'HOBC'
  }
}

export const FUEL_PRODUCT_COLORS: Record<FuelProductCode, string> = {
  petrol: '#22c55e',
  diesel: '#3b82f6',
  hobc: '#a855f7',
}
