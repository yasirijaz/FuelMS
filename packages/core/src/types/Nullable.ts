/**
 * Utility types for expressing optionality explicitly.
 *
 * TypeScript's `T | null` and `T | undefined` are often used interchangeably,
 * but they have different semantics in the domain:
 *
 * - null     → the value is intentionally absent (e.g. a person has no phone number)
 * - undefined → the value was never provided (e.g. an optional config field)
 * - Maybe<T> → either of the above; use when the distinction doesn't matter
 *
 * The domain should prefer explicit optionality over optional chaining everywhere.
 */

/** A value that may intentionally be null. */
export type Nullable<T> = T | null

/** A value that may not have been set. */
export type Optional<T> = T | undefined

/** A value that may be absent for any reason. */
export type Maybe<T> = T | null | undefined

/** DeepReadonly — recursively marks all properties as readonly. */
export type DeepReadonly<T> = T extends (infer U)[]
  ? ReadonlyArray<DeepReadonly<U>>
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T
