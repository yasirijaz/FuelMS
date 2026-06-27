import { ok, err } from '@fuelms/core'
import type { Result } from '@fuelms/core'
import { ValidationError } from '@fuelms/core'
import { ValueObject } from '@fuelms/domain'

interface PricePerLitreProps {
  /** Paisa per liter (integer minor units). Rs. 295.00/L = 29500. */
  minorPerLitre: number
}

/**
 * Selling price per liter stored as integer minor units to avoid float errors.
 * Spec: price must be positive; zero not permitted in Version 1.
 */
export class PricePerLitre extends ValueObject<PricePerLitreProps> {
  static fromRupees(rupees: number): Result<PricePerLitre, ValidationError> {
    if (!Number.isFinite(rupees)) {
      return err(new ValidationError('Selling price must be a valid number.'))
    }
    if (rupees <= 0) {
      return err(new ValidationError('Selling price must be greater than zero.'))
    }
    const minorPerLitre = Math.round(rupees * 100)
    if (minorPerLitre <= 0) {
      return err(new ValidationError('Selling price must be greater than zero.'))
    }
    return ok(new PricePerLitre({ minorPerLitre }))
  }

  static fromMinor(minorPerLitre: number): Result<PricePerLitre, ValidationError> {
    if (!Number.isInteger(minorPerLitre) || minorPerLitre <= 0) {
      return err(new ValidationError('Selling price must be a positive amount.'))
    }
    return ok(new PricePerLitre({ minorPerLitre }))
  }

  get minorPerLitre(): number {
    return this.props.minorPerLitre
  }

  toRupees(): number {
    return this.props.minorPerLitre / 100
  }

  formatRupees(): string {
    return this.toRupees().toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }
}
