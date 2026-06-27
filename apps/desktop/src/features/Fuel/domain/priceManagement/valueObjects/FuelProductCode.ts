import { ok, err } from '@fuelms/core'
import type { Result } from '@fuelms/core'
import { ValidationError } from '@fuelms/core'

/** Supported fuel products for selling price management (Version 1). */
export const FUEL_PRODUCT_CODES = ['petrol', 'diesel', 'hobc'] as const

export type FuelProductCode = (typeof FUEL_PRODUCT_CODES)[number]

export function isFuelProductCode(value: string): value is FuelProductCode {
  return (FUEL_PRODUCT_CODES as readonly string[]).includes(value)
}

export function parseFuelProductCode(value: string): Result<FuelProductCode, ValidationError> {
  const normalized = value.trim().toLowerCase()
  if (!isFuelProductCode(normalized)) {
    return err(
      new ValidationError(`Invalid fuel product "${value}". Expected petrol, diesel, or HOBC.`),
    )
  }
  return ok(normalized)
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
