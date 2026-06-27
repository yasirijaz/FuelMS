/**
 * Result<T, E> — Railway-oriented error handling.
 *
 * Why: TypeScript exceptions are invisible to the type system. Callers can
 * silently ignore thrown errors, leading to unhandled failure paths. Result<T, E>
 * makes the error contract explicit: every caller must handle both Ok and Err.
 *
 * Design: a plain discriminated union (not a class) so it is:
 * - Tree-shakeable (only import what you use)
 * - Serialisable (can be JSON.stringify'd without losing information)
 * - Composable with standard FP operators (map, flatMap, match)
 *
 * Default error type is `unknown` to avoid circular dependency with AppError.
 * Feature code specialises: Result<FuelBatch, DomainError>.
 */

export type Ok<T> = Readonly<{ ok: true; value: T }>
export type Err<E> = Readonly<{ ok: false; error: E }>

export type Result<T, E = unknown> = Ok<T> | Err<E>

// ─── Constructors ─────────────────────────────────────────────────────────────

/** Wraps a successful value. */
export function ok<T>(value: T): Ok<T> {
  return { ok: true, value }
}

/** Wraps an error value. */
export function err<E>(error: E): Err<E> {
  return { ok: false, error }
}

// ─── Type Guards ──────────────────────────────────────────────────────────────

export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.ok === true
}

export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return result.ok === false
}

// ─── Operators ────────────────────────────────────────────────────────────────

/**
 * Transform the Ok value. Passes Err through unchanged.
 *
 * @example
 * const result = map(ok(5), n => n * 2)  // Ok(10)
 * const result = map(err('oops'), n => n * 2)  // Err('oops')
 */
export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  if (isOk(result)) return ok(fn(result.value))
  return result
}

/**
 * Chain a fallible operation on the Ok value. Short-circuits on Err.
 *
 * @example
 * const result = flatMap(ok(5), n => n > 0 ? ok(n) : err('negative'))
 */
export function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> {
  if (isOk(result)) return fn(result.value)
  return result
}

/**
 * Map the error value. Passes Ok through unchanged.
 * Useful for wrapping infrastructure errors into domain errors.
 */
export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  if (isErr(result)) return err(fn(result.error))
  return result
}

/**
 * Fold/match: collapses a Result into a single value by providing handlers
 * for both variants. Both handlers must return the same type U.
 *
 * @example
 * const message = match(result, {
 *   ok:  (batch) => `Purchased ${batch.quantity}L`,
 *   err: (error) => `Failed: ${error.message}`,
 * })
 */
export function match<T, E, U>(
  result: Result<T, E>,
  handlers: { ok: (value: T) => U; err: (error: E) => U },
): U {
  if (isOk(result)) return handlers.ok(result.value)
  return handlers.err(result.error)
}

/**
 * Return the Ok value or a fallback.
 * Use when an error is acceptable and a default covers the gap.
 */
export function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
  if (isOk(result)) return result.value
  return fallback
}

/**
 * Unsafely extract the Ok value. Throws if Err.
 * Use ONLY in tests or in code that has already verified isOk().
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (isOk(result)) return result.value
  throw new Error(
    `[Result] unwrap called on Err: ${String(isErr(result) ? result.error : 'unknown')}`,
  )
}

/**
 * Unsafely extract the Err value. Throws if Ok.
 * Use ONLY in tests.
 */
export function unwrapErr<T, E>(result: Result<T, E>): E {
  if (isErr(result)) return result.error
  throw new Error('[Result] unwrapErr called on Ok')
}

/**
 * Collect an array of Results into a Result of array.
 * Short-circuits on the FIRST Err — all-or-nothing semantics.
 * Matches the "fail closed" principle from the AI Development Protocol.
 *
 * @example
 * combine([ok(1), ok(2), ok(3)])  // Ok([1, 2, 3])
 * combine([ok(1), err('oops'), ok(3)])  // Err('oops')
 */
export function combine<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = []
  for (const result of results) {
    if (isErr(result)) return result
    values.push(result.value)
  }
  return ok(values)
}

/**
 * Like combine(), but collects ALL errors instead of stopping at the first.
 * Useful for form validation where all field errors should be shown at once.
 */
export function combineAll<T, E>(results: Result<T, E>[]): Result<T[], E[]> {
  const values: T[] = []
  const errors: E[] = []
  for (const result of results) {
    if (isOk(result)) values.push(result.value)
    else errors.push(result.error)
  }
  if (errors.length > 0) return err(errors)
  return ok(values)
}

/**
 * Convert a Promise<T> that may throw into a Promise<Result<T, E>>.
 * Catches thrown errors and wraps them with the provided mapper.
 */
export async function tryCatch<T, E>(
  fn: () => Promise<T>,
  mapError: (caught: unknown) => E,
): Promise<Result<T, E>> {
  try {
    return ok(await fn())
  } catch (caught) {
    return err(mapError(caught))
  }
}
