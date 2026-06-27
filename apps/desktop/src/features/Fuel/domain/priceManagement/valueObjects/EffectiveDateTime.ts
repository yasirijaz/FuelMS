import { ok, err } from '@fuelms/core'
import type { Result } from '@fuelms/core'
import { ValidationError } from '@fuelms/core'
import { ValueObject } from '@fuelms/domain'

interface EffectiveDateTimeProps {
  /** UTC ISO-8601 timestamp when the price becomes effective for sales. */
  iso: string
}

export class EffectiveDateTime extends ValueObject<EffectiveDateTimeProps> {
  static fromDate(date: Date): Result<EffectiveDateTime, ValidationError> {
    if (Number.isNaN(date.getTime())) {
      return err(new ValidationError('Effective date/time is invalid.'))
    }
    return ok(new EffectiveDateTime({ iso: date.toISOString() }))
  }

  static fromIso(iso: string): Result<EffectiveDateTime, ValidationError> {
    const trimmed = iso.trim()
    const parsed = new Date(trimmed)
    if (Number.isNaN(parsed.getTime())) {
      return err(new ValidationError('Effective date/time must be a valid ISO-8601 timestamp.'))
    }
    return ok(new EffectiveDateTime({ iso: parsed.toISOString() }))
  }

  get iso(): string {
    return this.props.iso
  }

  toDate(): Date {
    return new Date(this.props.iso)
  }

  isInFuture(asOf: Date = new Date()): boolean {
    return this.toDate().getTime() > asOf.getTime()
  }

  isInPastOrPresent(asOf: Date = new Date()): boolean {
    return !this.isInFuture(asOf)
  }
}
