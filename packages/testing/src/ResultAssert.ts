import { isOk, isErr } from '@fuelms/core'
import type { Result } from '@fuelms/core'

/**
 * ResultAssert — assertion helpers for Result<T, E> in tests.
 *
 * Vitest's expect() works with Result values, but error messages from a failing
 * `expect(isOk(result)).toBe(true)` don't include the error details. These helpers
 * throw descriptive errors that include the actual error when the assertion fails.
 *
 * Usage with Vitest:
 *
 *   import { assertOk, assertErr } from '@fuelms/testing'
 *
 *   const result = await purchaseFuel(command)
 *   const batch = assertOk(result)           // throws with error details if Err
 *   expect(batch.quantityLitres).toBe(100)
 *
 *   const failResult = await purchaseFuel({ ...command, quantity: -1 })
 *   const error = assertErr(failResult)      // throws with value if Ok
 *   expect(error.kind).toBe('validation')
 */

/**
 * Assert that the result is Ok and return the value.
 * Throws a descriptive error if the result is Err.
 */
export function assertOk<T, E>(result: Result<T, E>, context?: string): T {
  if (!isOk(result)) {
    const prefix = context ? `[${context}] ` : ''
    const errorStr = result.error instanceof Error
      ? `${result.error.name}: ${result.error.message}`
      : String(result.error)
    throw new Error(`${prefix}Expected Ok but got Err: ${errorStr}`)
  }
  return result.value
}

/**
 * Assert that the result is Err and return the error.
 * Throws a descriptive error if the result is Ok.
 */
export function assertErr<T, E>(result: Result<T, E>, context?: string): E {
  if (!isErr(result)) {
    const prefix = context ? `[${context}] ` : ''
    throw new Error(`${prefix}Expected Err but got Ok: ${JSON.stringify(result.value)}`)
  }
  return result.error
}

/**
 * Assert that the result is Ok and run an assertion on the value.
 * Returns the value for further chaining.
 */
export function assertOkWith<T, E>(
  result: Result<T, E>,
  assertion: (value: T) => void,
  context?: string,
): T {
  const value = assertOk(result, context)
  assertion(value)
  return value
}

/**
 * Assert that the result is Err and run an assertion on the error.
 * Returns the error for further chaining.
 */
export function assertErrWith<T, E>(
  result: Result<T, E>,
  assertion: (error: E) => void,
  context?: string,
): E {
  const error = assertErr(result, context)
  assertion(error)
  return error
}
