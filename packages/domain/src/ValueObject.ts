import type { Result } from '@fuelms/core'
import type { ValidationError } from '@fuelms/core'

/**
 * ValueObject<Props> — an immutable object defined entirely by its attributes.
 *
 * Core DDD principle: two Value Objects with the same properties are equal,
 * regardless of whether they are the same instance in memory.
 *
 * Examples of Value Objects in FuelERP:
 *   Money        { amount: number; currency: 'PKR' }
 *   FuelQuantity { litres: number; precision: 3 }
 *   FuelPrice    { pricePerLitre: number; effectiveFrom: ISODate }
 *   DateRange    { from: ISODate; to: ISODate }
 *   PersonName   { display: string }
 *   PhoneNumber  { number: string; countryCode: string }
 *
 * Design decisions:
 *
 * 1. Protected constructor — prevents direct construction. Subclasses expose
 *    static factory methods (create, fromPersistence) that validate props and
 *    return Result<VO, ValidationError> rather than throwing.
 *
 * 2. Object.freeze on props — enforces immutability at runtime in addition to
 *    the TypeScript readonly modifier. Satisfies "Historical Accuracy" and
 *    "Immutability" principles from the governing architecture.
 *
 * 3. Structural equality via deepEqual — JSON.stringify is tempting but fails
 *    on undefined values, Date objects, and ordering differences. deepEqual
 *    handles these correctly.
 *
 * 4. `this` type in equals() — ensures subclasses inherit the correct type
 *    signature: MoneyVO.equals() only accepts another MoneyVO.
 *
 * Validation pattern (to be followed by subclasses):
 *
 *   export class Money extends ValueObject<MoneyProps> {
 *     static create(amount: number): Result<Money, ValidationError> {
 *       if (amount < 0) return err(new ValidationError('Amount cannot be negative'))
 *       return ok(new Money({ amount }))
 *     }
 *   }
 */

export abstract class ValueObject<Props extends object> {
  protected readonly props: Readonly<Props>

  protected constructor(props: Props) {
    this.props = Object.freeze({ ...props })
  }

  /**
   * Structural equality: same class AND same property values.
   *
   * Uses `this` type so subclass equality only accepts the same subclass:
   *   money.equals(quantity) → type error at compile time ✓
   */
  equals(other: this): boolean {
    if (other === null || other === undefined) return false
    if (other.constructor !== this.constructor) return false
    return deepEqual(this.props, other.props)
  }

  toString(): string {
    return `${this.constructor.name}(${JSON.stringify(this.props)})`
  }
}

// ─── Re-export ValidationResult convenience ───────────────────────────────────

/** Convenience alias used by Value Object factory methods. */
export type ValidationResult<T> = Result<T, ValidationError>

// ─── Private deep equality ────────────────────────────────────────────────────

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a === null || b === null) return false
  if (typeof a !== typeof b) return false

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime()
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((item, i) => deepEqual(item, (b as unknown[])[i]))
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a as object).sort()
    const keysB = Object.keys(b as object).sort()
    if (keysA.length !== keysB.length) return false
    if (!keysA.every((k, i) => k === keysB[i])) return false
    return keysA.every((k) =>
      deepEqual(
        (a as { [key: string]: unknown })[k],
        (b as { [key: string]: unknown })[k],
      ),
    )
  }

  return false
}
