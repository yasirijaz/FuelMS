/**
 * Brand<T, K> — lightweight nominal typing for primitives.
 *
 * TypeScript uses structural typing: two types with the same shape are
 * interchangeable. For primitive values (numbers, strings) that represent
 * distinct concepts, this is unsafe.
 *
 * Brand<T, K> tags a primitive with a phantom type K, creating a distinct
 * type that cannot be assigned from a plain T without an explicit cast.
 *
 * Usage:
 *   type Litres = Brand<number, 'Litres'>
 *   type Rupees = Brand<number, 'Rupees'>
 *
 *   function addFuel(quantity: Litres) { ... }
 *   addFuel(100)          // ← error: number is not Litres
 *   addFuel(100 as Litres) // ← explicit, intentional
 *
 * Prefer class-based UniqueId for aggregate IDs (richer API).
 * Use Brand<T, K> for primitive scalars like quantities, amounts, percentages.
 */
export type Brand<T, K extends string> = T & { readonly __brand: K }

/** Helper to create a branded value without an inline cast. */
export function brand<T, K extends string>(value: T): Brand<T, K> {
  return value as Brand<T, K>
}

// ─── Common branded primitives ────────────────────────────────────────────────
// These live here so different packages can import from a shared location
// without defining duplicates.

/** ISO-8601 UTC timestamp string (e.g. '2026-01-15T08:30:00.000Z'). */
export type ISOTimestamp = Brand<string, 'ISOTimestamp'>

/** ISO-8601 local date string (e.g. '2026-01-15'). */
export type ISODate = Brand<string, 'ISODate'>

/** A non-negative integer (≥ 0). Enforced by convention, not the type system. */
export type NonNegativeInt = Brand<number, 'NonNegativeInt'>

/** A strictly positive number (> 0). Enforced by convention. */
export type PositiveNumber = Brand<number, 'PositiveNumber'>
