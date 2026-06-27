import type { Result } from './types'

/** Wraps a value in a success Result. */
export function ok<T>(data: T): Result<T, never> {
  return { success: true, data }
}

/** Wraps an error in a failure Result. */
export function err<E = string>(error: E): Result<never, E> {
  return { success: false, error }
}

/** Returns `true` if both Results carry identical data/error values. */
export function isOk<T>(result: Result<T>): result is { success: true; data: T } {
  return result.success === true
}
